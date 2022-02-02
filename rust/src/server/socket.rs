

use std::fmt::Display;

use futures::{stream::{SplitStream, SplitSink}, StreamExt, SinkExt};

use tokio::{sync::mpsc::{Sender, channel, Receiver}, net::TcpStream};
use tokio_tungstenite::{WebSocketStream, tungstenite};


use super::message::{Message};

type Tx = Sender<Message>;
type WSStream = WebSocketStream<TcpStream>;
type MessageStream = SplitStream<WSStream>;

pub struct Socket {
    listener: Option<Tx>,
    pub rx: Receiver<Message>,
    outgoing: SplitSink<WebSocketStream<TcpStream>, tungstenite::Message>
}

pub async fn handle_messages(mut incoming: MessageStream, tx: Tx) {
    while let Some(Ok(msg)) = incoming.next().await {
        if msg.is_text() {
            let text = match msg.into_text() {
                Err(_) => return,
                Ok(txt) => txt,
            };
            tx.send(Message::new(text)).await;
        }
    }
}

impl Socket {
    pub async fn new(ws_stream: WSStream) -> Socket {
        let (outgoing, incoming) = ws_stream.split();

        // from network to me
        let (incoming_tx, incoming_rx) = channel::<Message>(10);

        tokio::spawn(handle_messages(incoming, incoming_tx));

        return Socket {
            listener: None,
            rx: incoming_rx,
            outgoing,
        };
    }

    pub async fn push(&mut self, msg: &Message) {
        match msg {
            Message::Message(msg) => {
                self.outgoing.send(tokio_tungstenite::tungstenite::Message::Text(msg.msg.clone())).await;
            },
            _ => {}
        };
    }
}

impl Display for Socket {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Socket here!")
    }
}

