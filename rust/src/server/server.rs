use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

use futures_util::{future, stream::TryStreamExt, StreamExt};

use tokio::{net::{TcpStream, TcpListener}, sync::mpsc::{unbounded_channel, UnboundedSender}, task::JoinHandle};

use crate::server::message::Emitter;

use super::{message::Message, socket::Socket};

type Tx = UnboundedSender<Message>;
type Sockets = Arc<Mutex<HashMap<usize, Socket>>>;

pub async fn handle_connection(sockets: Sockets, id: usize, raw_stream: TcpStream) {
    println!("Incoming TCP connection from: {}", id);

    let ws_stream = tokio_tungstenite::accept_async(raw_stream)
        .await
        .expect("Error during the websocket handshake occurred");
    println!("WebSocket connection established: {}", id);

    // Insert the write part of this peer to the peer map.
    let (incoming_tx, incoming_rx) = unbounded_channel();
    // let (outgoing_tx, outgoing_rx) = unbounded_channel();
    let socket = Socket::new(incoming_rx);

    sockets.lock().unwrap().insert(id, socket);

    let (_, incoming) = ws_stream.split();

    let inner_id = id.clone();
    let broadcast_incoming = incoming.try_for_each(move |msg| {
        println!("Received a message from {}: {}", inner_id, msg.to_text().unwrap());
        if msg.is_text() {
            let text = match msg.into_text() {
                Err(_) => return future::ok(()),
                Ok(txt) => txt,
            };

            match incoming_tx.send(Message::new(inner_id, text)) {
                Err(_e) => {
                    // ...
                },
                Ok(_) => {}
            }
        }
        future::ok(())
    });

    tokio::spawn(async move {
        match broadcast_incoming.await {
            Err(e) => eprintln!("Socket receiver ended {} with {:?}", id, e),
            _ => println!("Socket receiver ended in great success! {}", id),
        }
        sockets.lock().unwrap().remove(&id);
    });
}

pub struct Server {
    pub join_handle: JoinHandle<()>,
    listeners: Arc<Mutex<Vec<Tx>>>,
}

impl Server {
    pub async fn new() -> Result<Server, std::io::Error> {
        let addr = "127.0.0.1:8080".to_string();
        let state: Sockets = Arc::new(Mutex::new(HashMap::new()));

        // Create the event loop and TCP listener we'll accept connections on.
        let try_socket = TcpListener::bind(&addr).await;
        let listener = try_socket.expect("Failed to bind");

        println!("Listening on: {}", addr);

        let listeners = Arc::new(Mutex::new(vec![]));
        let inner_listeners = listeners.clone();

        // Let's spawn the handling of each connection in a separate task.
        let join_handle = tokio::spawn(async move {

            let mut id = 0usize;
            while let Ok((stream, _)) = listener.accept().await {
                id += 1;
                handle_connection(state.clone(), id, stream).await;

                let (tx, mut rx) = unbounded_channel::<Message>();

                let inner_inner_listeners = inner_listeners.clone();
                tokio::spawn(async move {
                    while let Some(msg) = rx.recv().await {
                        inner_inner_listeners.lock().unwrap().iter().for_each(|listener: &UnboundedSender<Message>| {
                            match listener.send(msg.clone()) {
                                Err(_e) => { },
                                Ok(_) => { },
                            }
                        });
                    }
                });

                state.lock().unwrap().get_mut(&id.clone()).unwrap().listen(tx);
            }
        });

        return Ok(Server {
            join_handle,
            listeners,
        });
    }
}

impl Emitter for Server {
    fn listen(&mut self, tx: Tx) {
        self.listeners.lock().unwrap().push(tx);
    }
}
