use std::fmt::Display;

use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessageType {
    ReadyUp = 0,
    Play = 1,
    Fire = 2,
    GameOver = 3,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub r#type: MessageType,
    pub msg: Option<String>,
}

#[derive(Debug, Clone)]
pub enum Message {
    Message(ChatMessage),
    Close(),
}

impl Message {
    pub fn new(t: MessageType) -> Message {
        return Message::Message(ChatMessage {
            r#type: t,
            msg: None
        });
    }

    pub fn with_message(t: MessageType, msg: String) -> Message {
        return Message::Message(ChatMessage {
            r#type: t,
            msg: Some(msg),
        });
    }
}

impl Display for Message {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        return match self {
            Message::Message(c) => {
                match c.msg {
                    Some(m) => write!(f, "Message: {:?} {}", c.r#type, m),
                    None => write!(f, "Message: {:?}", c.r#type)
                }
            }
            Message::Close() => write!(f, "Socket Closed"),
        };
    }
}
