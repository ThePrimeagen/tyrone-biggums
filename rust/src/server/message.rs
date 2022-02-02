use std::fmt::Display;

use tokio::sync::mpsc::Sender;

#[derive(Debug, Clone)]
pub struct ChatMessage {
    pub msg: String,
}

#[derive(Debug, Clone)]
pub enum Message {
    Message(ChatMessage),
    Close(),
}

impl Message {
    pub fn new(msg: String) -> Message {
        return Message::Message(ChatMessage { msg });
    }

    pub fn from_message(message: Message, msg: String) -> Message {
        return match message {
            Message::Message(_c) => Message::Message(ChatMessage { msg }),
            Message::Close() => message,
        };
    }

    pub fn from_chat_message(_message: ChatMessage, msg: String) -> Message {
        return Message::Message(ChatMessage { msg });
    }
}

impl Display for Message {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        return match self {
            Message::Message(c) => write!(f, "Message: {}", c.msg),
            Message::Close() => write!(f, "Socket Closed"),
        };
    }
}

pub trait Receiver<T> {
    // Todo: async?
    fn receive<E: Emitter<T>>(&mut self, tx: &mut E);
}

pub trait Emitter<T> {
    // Todo: async?
    fn listen(&mut self, tx: Sender<T>);
}
