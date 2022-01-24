use std::fmt::Display;

use tokio::sync::mpsc::UnboundedSender;

#[derive(Debug, Clone)]
pub struct ChatMessage {
    pub id: usize,
    pub msg: String,
}

#[derive(Debug, Clone)]
pub enum Message {
    Message(ChatMessage),
    Close(usize)
}

impl Message {
    pub fn new(id: usize, msg: String) -> Message {
        return Message::Message(ChatMessage { id, msg });
    }

    pub fn from_message(message: Message, msg: String) -> Message {
        return match message {
            Message::Message(c) => Message::Message(ChatMessage {
                id: c.id,
                msg,
            }),
            Message::Close(_id) => message
        }
    }

    pub fn from_chat_message(message: ChatMessage, msg: String) -> Message {
        return Message::Message(ChatMessage {
                id: message.id,
                msg,
            });
    }
}

impl Display for Message {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        return match self {
            Message::Message(c) => write!(f, "Message {}: {}", c.id, c.msg),
            Message::Close(id) => write!(f, "Close Message for {}", id)
        }
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
