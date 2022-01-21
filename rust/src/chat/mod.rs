use tokio::sync::mpsc::unbounded_channel;

use crate::server::message::{Emitter, Message};

pub struct Chat {
}

impl Chat {
    pub fn new<T: Emitter>(emitter: &mut T) -> Chat {
        let (tx, mut rx) = unbounded_channel::<Message>();
        emitter.listen(tx);

        tokio::spawn(async move {
            while let Some(msg) = rx.recv().await {
                println!("chat {}", msg);
            }
        });
        return Chat {};
    }
}
