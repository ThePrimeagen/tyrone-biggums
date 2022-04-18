

use futures::{SinkExt};
use futures_util::{StreamExt};

use log::info;
use tokio::{
    net::{TcpListener, TcpStream},
    sync::mpsc::{channel, Receiver},
    task::JoinHandle,
};

use super::{
    socket::Socket,
};

type Rx = Receiver<(Socket, Socket)>;

pub async fn handle_connection(raw_stream: TcpStream) -> Socket {
    info!("Incoming TCP connection from");

    // TODO: move this into Error
    let ws_stream = tokio_tungstenite::accept_async(raw_stream)
        .await
        .expect("Error during the websocket handshake occurred");

    info!("WebSocket connection established");

    // let (outgoing_tx, outgoing_rx) = unbounded_channel();
    return Socket::new(ws_stream).await;
}

pub struct Server {
    pub listener: TcpListener
}

impl Server {
    pub async fn new() -> Result<Server, std::io::Error> {
        let addr = "0.0.0.0:42069".to_string();

        // Create the event loop and TCP listener we'll accept connections on.
        let try_socket = TcpListener::bind(&addr).await;
        let listener = try_socket.expect("Failed to bind");

        info!("Listening on: {}", addr);

        Ok(Server {
            listener
        })
    }
}

