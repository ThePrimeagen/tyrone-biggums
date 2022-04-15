use std::{
    net::SocketAddr,
    pin::Pin,
    task::{Context, Poll},
};

use anyhow::{Context as _, Result};
use futures_util::{
    stream::{SplitSink, SplitStream},
    Sink, SinkExt, Stream, StreamExt,
};
use tokio::net::TcpStream;
use tokio_tungstenite::{tungstenite::Message as WebsocketMessage, WebSocketStream};

use crate::{
    game_result::GameStats,
    message::{Message, MessageType},
};

pin_project_lite::pin_project! {
    pub struct ConnectionReadHalf {
        addr: SocketAddr,
        #[pin]
        stream: SplitStream<WebSocketStream<TcpStream>>,
    }
}

pin_project_lite::pin_project! {
    pub struct ConnectionWriteHalf {
        addr: SocketAddr,
        #[pin]
        sink: SplitSink<WebSocketStream<TcpStream>, WebsocketMessage>,
    }
}

pin_project_lite::pin_project! {
    pub struct Connection {
        addr: SocketAddr,
        #[pin]
        read: ConnectionReadHalf,
        #[pin]
        write: ConnectionWriteHalf,
    }
}

impl Connection {
    /// Creates new connection read and write halves
    pub fn new(addr: SocketAddr, stream: WebSocketStream<TcpStream>) -> Self {
        let (sink, stream) = stream.split();

        Self {
            addr,
            read: ConnectionReadHalf { addr, stream },
            write: ConnectionWriteHalf { addr, sink },
        }
    }

    /// Returns the socket address of the connection
    pub fn get_addr(&self) -> SocketAddr {
        self.addr
    }

    /// Waits for `ReadyUp` message from the connection
    pub async fn wait_ready_up(&mut self) -> Result<()> {
        self.read.wait_ready_up().await
    }

    /// Sends `ReadyUp` message to the connection
    pub async fn ready_up(&mut self) -> Result<()> {
        self.write.ready_up().await
    }

    /// Sends `Play` message to the connection
    pub async fn play(&mut self) -> Result<()> {
        self.write.play().await
    }

    /// Splits the connection into read and write halves
    pub fn split(self) -> (ConnectionReadHalf, ConnectionWriteHalf) {
        (self.read, self.write)
    }
}

impl Stream for Connection {
    type Item = Result<Message>;

    fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
        let this = self.project();
        let stream = this.read;

        stream.poll_next(cx)
    }

    fn size_hint(&self) -> (usize, Option<usize>) {
        self.read.size_hint()
    }
}

impl Sink<Message> for Connection {
    type Error = anyhow::Error;

    fn poll_ready(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        let this = self.project();
        let stream = this.write;

        stream.poll_ready(cx)
    }

    fn start_send(self: Pin<&mut Self>, message: Message) -> Result<(), Self::Error> {
        let this = self.project();
        let stream = this.write;

        stream.start_send(message)
    }

    fn poll_flush(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        let this = self.project();
        let stream = this.write;

        stream.poll_flush(cx)
    }

    fn poll_close(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        let this = self.project();
        let stream = this.write;

        stream.poll_close(cx)
    }
}

impl ConnectionReadHalf {
    /// Returns the socket address of the connection
    pub fn get_addr(&self) -> SocketAddr {
        self.addr
    }

    /// Waits for `ReadyUp` message from the connection
    pub async fn wait_ready_up(&mut self) -> Result<()> {
        let message = self.receive_message().await?;

        if matches!(message.message_type, MessageType::ReadyUp) {
            Ok(())
        } else {
            Err(anyhow::anyhow!("expected `Play` message"))
        }
    }

    /// Receives a message from websocket connection
    async fn receive_message(&mut self) -> Result<Message> {
        self.next().await.context(format!(
            "unable to receive websocket message from player {}",
            self.addr
        ))?
    }
}

impl ConnectionWriteHalf {
    /// Returns the socket address of the connection
    pub fn get_addr(&self) -> SocketAddr {
        self.addr
    }

    /// Sends `ReadyUp` message to the connection
    pub async fn ready_up(&mut self) -> Result<()> {
        self.send_message(MessageType::ReadyUp).await
    }

    /// Sends `Play` message to the connection
    pub async fn play(&mut self) -> Result<()> {
        self.send_message(MessageType::Play).await
    }

    /// Sends a `GameOver` message to the connection with data as `loser`
    pub async fn send_loser(&mut self) -> Result<()> {
        self.send_message(Message::new(MessageType::GameOver).with_data("loser".to_owned()))
            .await
    }

    /// Sends a `GameOver` message to the connection with data as `winner`
    pub async fn send_winner(&mut self, game_stats: &GameStats, active_games: usize) -> Result<()> {
        let message_str = format!("winner({})___{}", active_games, game_stats);

        self.send_message(Message::new(MessageType::GameOver).with_data(message_str))
            .await
    }

    /// Closes the connection
    pub async fn close(mut self) -> Result<()> {
        self.sink
            .close()
            .await
            .context("failed to close connection")
    }

    /// Send a message to websocket connection
    async fn send_message(&mut self, message: impl Into<Message>) -> Result<()> {
        self.send(message.into()).await.context(format!(
            "unable to send websocket message to player {}",
            self.addr
        ))
    }
}

impl Stream for ConnectionReadHalf {
    type Item = Result<Message>;

    fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
        let this = self.project();
        let stream = this.stream;

        let optional = stream.poll_next(cx);

        match optional {
            Poll::Ready(Some(Ok(message))) => Poll::Ready(Some(message.try_into())),
            Poll::Ready(Some(Err(e))) => Poll::Ready(Some(Err(e.into()))),
            Poll::Ready(None) => Poll::Ready(None),
            Poll::Pending => Poll::Pending,
        }
    }

    fn size_hint(&self) -> (usize, Option<usize>) {
        self.stream.size_hint()
    }
}

impl Sink<Message> for ConnectionWriteHalf {
    type Error = anyhow::Error;

    fn poll_ready(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        let this = self.project();
        let stream = this.sink;

        stream.poll_ready(cx).map_err(Into::into)
    }

    fn start_send(self: Pin<&mut Self>, message: Message) -> Result<(), Self::Error> {
        let this = self.project();
        let stream = this.sink;

        stream.start_send(message.try_into()?).map_err(Into::into)
    }

    fn poll_flush(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        let this = self.project();
        let stream = this.sink;

        stream.poll_flush(cx).map_err(Into::into)
    }

    fn poll_close(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        let this = self.project();
        let stream = this.sink;

        stream.poll_close(cx).map_err(Into::into)
    }
}
