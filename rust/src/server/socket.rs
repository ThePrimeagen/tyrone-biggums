use std::{fmt::Display, collections::HashMap, sync::{Arc}};

use futures::{stream::{SplitStream, SplitSink}, StreamExt, SinkExt};

use log::error;
use tokio::{sync::{mpsc::{Sender}, Mutex}, net::TcpStream};
use tokio_tungstenite::{WebSocketStream, tungstenite};

use crate::error::BoomerError;

use super::message::{Message};
use async_trait::async_trait;

#[async_trait]
pub trait Listenable {
    async fn listen(&mut self, tx: Tx) -> u16;
    async fn off(&mut self, id: u16);
}

type Tx = Sender<Message>;
type Listener = Arc<Mutex<HashMap<u16, Tx>>>;
type WSStream = WebSocketStream<TcpStream>;
type MessageStream = SplitStream<WSStream>;

pub struct Socket {
    current_id: u16,
    listeners: Listener,
    outgoing: SplitSink<WebSocketStream<TcpStream>, tungstenite::Message>
}

pub async fn handle_messages(mut incoming: MessageStream, listeners: Listener) {
    while let Some(Ok(msg)) = incoming.next().await {
        if msg.is_text() {
            let text = match msg.into_text() {
                Err(_) => return,
                Ok(txt) => txt,
            };

            let msg: Result<Message, serde_json::Error> = text.try_into();

            if let Ok(msg) = msg {
                let listener = listeners.lock().await;
                for (_k, tx) in listener.iter() {
                    tx.send(msg.clone()).await;
                }
            } else {
                error!("unable to deserialize message from socket")
            }
        }
    }
}

impl Socket {
    pub async fn new(ws_stream: WSStream) -> Socket {
        let (outgoing, incoming) = ws_stream.split();

        // from network to me
        let listeners = Arc::new(Mutex::new(HashMap::new()));

        tokio::spawn(handle_messages(incoming, listeners.clone()));

        return Socket {
            outgoing,
            listeners,
            current_id: 0,
        };
    }

    pub async fn push(&mut self, msg: Message) -> Result<(), BoomerError> {
        let msg: tungstenite::Message = tungstenite::Message::Text(msg.try_into()?);
        self.outgoing.send(msg).await?;
        return Ok(());
    }

    pub async fn close(&mut self) -> Result<(), BoomerError> {
        self.outgoing.close().await?;
        return Ok(());
    }
}

#[async_trait]
impl Listenable for Socket {
    async fn listen(& mut self, tx: Tx) -> u16 {
        let id = self.current_id;
        self.current_id += 1;
        self.listeners.lock().await.insert(id, tx);

        return id;
    }

    async fn off(&mut self, id: u16) {
        self.listeners.lock().await.remove_entry(&id);
    }
}

impl Display for Socket {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Socket here!")
    }
}

