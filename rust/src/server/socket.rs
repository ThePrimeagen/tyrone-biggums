use std::sync::{Arc, Mutex};

use tokio::sync::mpsc::{UnboundedSender, UnboundedReceiver};

use super::message::{Message, Emitter};

pub struct Socket {
    listeners: Arc<Mutex<Vec<UnboundedSender<Message>>>>,
}

impl Socket {

    pub fn new(mut rx: UnboundedReceiver<Message>) -> Socket {
        let listeners = Arc::new(Mutex::new(vec![]));
        let inner_listeners = listeners.clone();

        tokio::spawn(async move {
            while let Some(msg) = rx.recv().await {
                inner_listeners.lock().unwrap().iter().for_each(|listener: &UnboundedSender<Message>| {
                    match listener.send(msg.clone()) {
                        Err(_e) => { },
                        Ok(_) => { },
                    }
                });
            }
        });

        return Socket {
            listeners
        };
    }
}

impl Emitter for Socket {
    fn listen(&mut self, tx: UnboundedSender<Message>) {
        self.listeners.lock().unwrap().push(tx);
    }
}
