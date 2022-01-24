use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

use futures::SinkExt;
use futures_util::{future, stream::TryStreamExt, StreamExt};

use log::info;
use tokio::{
    net::{TcpListener, TcpStream},
    sync::mpsc::{unbounded_channel, UnboundedSender},
    task::JoinHandle,
};

use crate::server::message::Emitter;

use super::{
    message::{Message, Receiver},
    socket::Socket,
};

type Tx = UnboundedSender<Message>;
type Sockets = Arc<Mutex<HashMap<usize, Socket>>>;

pub async fn handle_connection(sockets: Sockets, id: usize, raw_stream: TcpStream) {
    info!("Incoming TCP connection from: {}", id);

    let ws_stream = tokio_tungstenite::accept_async(raw_stream)
        .await
        .expect("Error during the websocket handshake occurred");
    info!("WebSocket connection established: {}", id);

    // Insert the write part of this peer to the peer map.
    let (incoming_tx, incoming_rx) = unbounded_channel();
    let (outgoing_tx, mut outgoing_rx) = unbounded_channel::<Message>();

    // let (outgoing_tx, outgoing_rx) = unbounded_channel();
    let socket = Socket::new(incoming_rx, outgoing_tx, id);

    sockets.lock().unwrap().insert(id, socket);

    let (mut outgoing, incoming) = ws_stream.split();

    let inner_id = id.clone();
    let broadcast_incoming = incoming.try_for_each(move |msg| {
        info!(
            "Received a message from {}: {}",
            inner_id,
            msg.to_text().unwrap()
        );
        if msg.is_text() {
            let text = match msg.into_text() {
                Err(_) => return future::ok(()),
                Ok(txt) => txt,
            };

            match incoming_tx.send(Message::new(inner_id, text)) {
                Err(_e) => {
                    // ...
                }
                Ok(_) => {}
            }
        }
        future::ok(())
    });

    tokio::spawn(async move {
        println!("waiting for broadcast_incoming to finish");
        match broadcast_incoming.await {
            Err(e) => info!("Socket receiver ended {} with {:?}", id, e),
            _ => info!("Socket receiver ended in great success! {}", id),
        }
        sockets.lock().unwrap().remove(&id);
    });

    tokio::spawn(async move {
        while let Some(msg) = outgoing_rx.recv().await {
            match msg {
                Message::Message(c) => {
                    match outgoing.send(tokio_tungstenite::tungstenite::Message::Text(c.msg)).await {
                        Err(e) => {
                            eprintln!("Socket receiver ended {} with {:?}", id, e);
                            break;
                        }
                        _ => {}
                    }
                }
                Message::Close(_) => break,
            }
        }
        match outgoing.close().await {
            Err(e) => {
                eprintln!("unable to close outgoing({}): {:?}", id, e);
            }
            _ => {}
        }
    });
}

pub struct Server {
    pub join_handle: JoinHandle<()>,
    listeners: Arc<Mutex<Vec<Tx>>>,
    sockets: Sockets,
}

impl Server {
    pub async fn new() -> Result<Server, std::io::Error> {
        let addr = "127.0.0.1:42069".to_string();
        let sockets: Sockets = Arc::new(Mutex::new(HashMap::new()));

        // Create the event loop and TCP listener we'll accept connections on.
        let try_socket = TcpListener::bind(&addr).await;
        let listener = try_socket.expect("Failed to bind");

        info!("Listening on: {}", addr);

        let listeners = Arc::new(Mutex::new(vec![]));
        let inner_listeners = listeners.clone();

        // Let's spawn the handling of each connection in a separate task.
        let inner_sockets = sockets.clone();
        let join_handle = tokio::spawn(async move {
            let mut id = 0usize;
            while let Ok((stream, _)) = listener.accept().await {
                id += 1;
                handle_connection(inner_sockets.clone(), id, stream).await;

                let (tx, mut rx) = unbounded_channel::<Message>();

                let inner_inner_listeners = inner_listeners.clone();
                tokio::spawn(async move {
                    while let Some(msg) = rx.recv().await {
                        inner_inner_listeners.lock().unwrap().iter().for_each(
                            |listener: &UnboundedSender<Message>| match listener.send(msg.clone()) {
                                Err(_e) => {}
                                Ok(_) => {}
                            },
                        );
                    }
                });

                inner_sockets
                    .lock()
                    .unwrap()
                    .get_mut(&id.clone())
                    .unwrap()
                    .listen(tx);
            }
        });

        return Ok(Server {
            join_handle,
            listeners,
            sockets,
        });
    }
}

impl Receiver<Vec<Message>> for Server {
    fn receive<E: Emitter<Vec<Message>>>(&mut self, emitter: &mut E) {
        let (tx, mut rx) = unbounded_channel::<Vec<Message>>();
        emitter.listen(tx);

        let sockets = self.sockets.clone();
        info!("receiver has been set");
        tokio::spawn(async move {
            info!("receiver is waiting for messages.");
            while let Some(messages) = rx.recv().await {
                let sockets = sockets.lock().expect("lock to never fail");
                info!("receiver got message({}) {:?}", sockets.len(), messages);
                for msg in &messages {

                    let chat_msg = match msg {
                        Message::Message(msg) => msg,
                        Message::Close(_) => unreachable!("Close messages should never be sent back to the server.")
                    };

                    info!("receiver sending message to {}", chat_msg.id);
                    match sockets.get(&chat_msg.id) {
                        Some(socket) => {
                            info!("receiver found socket {}", chat_msg.id);
                            socket.push(&msg)
                        }
                        _ => {}
                    }
                }
            }
        });
    }
}

impl Emitter<Message> for Server {
    fn listen(&mut self, tx: Tx) {
        self.listeners.lock().unwrap().push(tx);
    }
}
