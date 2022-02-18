use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

use futures::{SinkExt, stream::{SplitStream}};
use futures_util::{StreamExt};

use log::info;
use tokio::{
    net::{TcpListener, TcpStream},
    sync::mpsc::{channel, Sender, Receiver},
    task::JoinHandle,
};

use super::{
    message::{Message},
    socket::Socket,
};

type Rx = Receiver<(Socket, Socket)>;

pub async fn handle_connection(raw_stream: TcpStream) -> Socket {
    info!("Incoming TCP connection from");

    let ws_stream = tokio_tungstenite::accept_async(raw_stream)
        .await
        .expect("Error during the websocket handshake occurred");

    info!("WebSocket connection established");

    // let (outgoing_tx, outgoing_rx) = unbounded_channel();
    return Socket::new(ws_stream).await;
}

pub struct Server {
    pub join_handle: JoinHandle<()>,
    pub rx: Option<Rx>, // crappy, but we will let it slide
}

impl Server {
    pub async fn new() -> Result<Server, std::io::Error> {
        let addr = "0.0.0.0:42069".to_string();

        // Create the event loop and TCP listener we'll accept connections on.
        let try_socket = TcpListener::bind(&addr).await;
        let listener = try_socket.expect("Failed to bind");
        let (tx, rx) = channel::<(Socket, Socket)>(10);

        info!("Listening on: {}", addr);

        let join_handle = tokio::spawn(async move {
            let mut other_socket: Option<Socket> = None;
            while let Ok((stream, _)) = listener.accept().await {
                let socket = handle_connection(stream).await;
                if let Some(other_socket) = other_socket.take() {
                    tx.send((other_socket, socket)).await;
                } else {
                    other_socket = Some(socket);
                }
            }
        });

        return Ok(Server {
            join_handle,
            rx: Some(rx),
        });
    }

    pub fn get_receiver(&mut self) -> Option<Rx> {
        return std::mem::take(&mut self.rx);
    }
}

