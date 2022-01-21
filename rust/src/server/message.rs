use std::fmt::Display;

use tokio::sync::mpsc::UnboundedSender;

#[derive(Debug, Clone)]
pub struct Message {
    pub id: usize,
    pub msg: String,
}

impl Message {
    pub fn new(id: usize, msg: String) -> Message {
        return Message { id, msg };
    }

    pub fn from_message(message: Message, msg: String) -> Message {
        return Message {
            id: message.id,
            msg,
        };
    }
}

impl Display for Message {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Message {}: {}", self.id, self.msg)
    }
}

pub trait Receiver<T> {
    // Todo: async?
    fn receive<E: Emitter<T>>(&mut self, tx: &mut E);
}

pub trait Emitter<T> {
    // Todo: async?
    fn listen(&mut self, tx: UnboundedSender<T>);
}
