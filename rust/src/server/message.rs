use tokio::sync::mpsc::UnboundedSender;

#[derive(Debug, Clone)]
pub struct Message {
    id: usize,
    msg: String,
}

impl Message {
    pub fn new(id: usize, msg: String) -> Message {
        return Message {
            id, msg
        };
    }

    pub fn from_message(message: Message, msg: String) -> Message {
        return Message {
            id: message.id, msg
        };
    }
}

pub trait Sender {
    // Todo: async?
    fn push(msg: Message);
}

pub trait Emitter {
    // Todo: async?
    fn listen(&mut self, tx: UnboundedSender<Message>);
}
