use std::{fmt::Display};

use serde::{Serialize, Deserialize};
use serde_repr::{Serialize_repr, Deserialize_repr};

#[derive(Debug, Clone, Serialize_repr, Deserialize_repr)]
#[repr(u8)]
pub enum MessageType {
    ReadyUp = 0,
    Play = 1,
    Fire = 2,
    GameOver = 3,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameMessage {
    pub r#type: MessageType,
    pub msg: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Message {
    Message(GameMessage),
    Close(),
}

impl Message {
    pub fn new(t: MessageType) -> Message {
        return Message::Message(GameMessage {
            r#type: t,
            msg: None
        });
    }

    pub fn with_message(t: MessageType, msg: String) -> Message {
        return Message::Message(GameMessage {
            r#type: t,
            msg: Some(msg),
        });
    }

    pub fn close() -> Message {
        return Message::Close()
    }
}

impl TryInto<Message> for String {
    type Error = serde_json::Error;

    fn try_into(self) -> Result<Message, Self::Error> {
        let msg = serde_json::from_str::<GameMessage>(&self)?;
        return Ok(Message::Message(msg));
    }
}

impl TryInto<String> for Message {
    type Error = serde_json::Error;

    fn try_into(self) -> Result<String, Self::Error> {
        return match self {
            Message::Message(msg) => serde_json::to_string(&msg),
            _ => Ok("{}".to_string()),
        }
    }
}

impl Display for Message {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        return match self {
            Message::Message(c) => {
                match &c.msg {
                    Some(m) => write!(f, "Message: {:?} {}", c.r#type, m),
                    None => write!(f, "Message: {:?}", c.r#type)
                }
            }
            Message::Close() => write!(f, "Socket Closed"),
        };
    }
}
