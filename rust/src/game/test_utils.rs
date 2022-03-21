use std::sync::Arc;

use tokio::sync::Mutex;

use crate::server::message::Message;
use crate::server::socket::Listenable;
use async_trait::async_trait;

pub type Tx = tokio::sync::mpsc::Sender<Message>;
pub type TxList = Arc<Mutex<Vec<Tx>>>;


pub struct Socket {
    pub listeners: Arc<Mutex<Vec<Tx>>>
}

impl Socket {
    pub fn new() -> Socket {
        return Socket {
            listeners: Arc::new(Mutex::new(Vec::new())),
        };
    }
}

#[async_trait]
impl Listenable for Socket {
    async fn listen(& mut self, tx: Tx) -> u16 {
        self.listeners.lock().await.push(tx);
        return 0u16;
    }

    async fn off(&mut self, _id: u16) {
        self.listeners.lock().await.pop(); // don't care
    }
}


