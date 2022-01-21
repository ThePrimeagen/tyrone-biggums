use std::sync::{Arc, Mutex};

use futures::SinkExt;
use log::info;
use tokio::sync::mpsc::{UnboundedReceiver, UnboundedSender};

use super::message::{Emitter, Message};
type Tx = UnboundedSender<Message>;

pub struct Socket {
    tx: Tx,
    listeners: Arc<Mutex<Vec<UnboundedSender<Message>>>>,
}

impl Socket {
    pub fn new(mut rx: UnboundedReceiver<Message>, tx: Tx) -> Socket {
        let listeners = Arc::new(Mutex::new(vec![]));
        let inner_listeners = listeners.clone();

        tokio::spawn(async move {
            while let Some(msg) = rx.recv().await {
                inner_listeners.lock().unwrap().iter().for_each(
                    |listener: &UnboundedSender<Message>| match listener.send(msg.clone()) {
                        Err(_e) => {}
                        Ok(_) => {}
                    },
                );
            }
        });

        return Socket { listeners, tx };
    }

    pub fn push(&self, msg: &Message) {
        info!("socket.push: {:?}", msg);
        match self.tx.send(msg.clone()) {
            Err(_e) => panic!("self.tx failed to push on socket"),
            _ => {}
        }
    }
}

impl Emitter<Message> for Socket {
    fn listen(&mut self, tx: UnboundedSender<Message>) {
        self.listeners.lock().unwrap().push(tx);
    }
}
