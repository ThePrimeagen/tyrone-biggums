use anyhow::Context;
use serde::{Deserialize, Serialize};
use tokio_tungstenite::tungstenite::Message as WebsocketMessage;

#[derive(Debug, Clone, Copy)]
pub enum MessageType {
    ReadyUp,
    Play,
    Fire,
    GameOver,
    Kill,
}

impl From<MessageType> for u8 {
    fn from(message_type: MessageType) -> Self {
        match message_type {
            MessageType::ReadyUp => 0,
            MessageType::Play => 1,
            MessageType::Fire => 2,
            MessageType::GameOver => 3,
            MessageType::Kill => 4,
        }
    }
}

impl From<u8> for MessageType {
    fn from(message_type: u8) -> Self {
        match message_type {
            0 => MessageType::ReadyUp,
            1 => MessageType::Play,
            2 => MessageType::Fire,
            3 => MessageType::GameOver,
            4 => MessageType::Kill,
            _ => panic!("invalid message type"),
        }
    }
}

impl Serialize for MessageType {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_u8((*self).into())
    }
}

impl<'de> Deserialize<'de> for MessageType {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let message_type: u8 = Deserialize::deserialize(deserializer)?;
        Ok(message_type.into())
    }
}

impl From<MessageType> for Message {
    fn from(message_type: MessageType) -> Self {
        Message::new(message_type)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Message {
    #[serde(rename = "type")]
    pub message_type: MessageType,
    #[serde(rename = "msg")]
    pub data: Option<String>,
}

impl Message {
    pub fn new(message_type: MessageType) -> Self {
        Self {
            message_type,
            data: None,
        }
    }

    pub fn with_data(mut self, data: String) -> Self {
        self.data = Some(data);
        self
    }
}

impl TryFrom<WebsocketMessage> for Message {
    type Error = anyhow::Error;

    fn try_from(message: WebsocketMessage) -> Result<Self, Self::Error> {
        match message {
            WebsocketMessage::Text(text) => serde_json::from_str(&text).map_err(Into::into),
            _ => Err(anyhow::anyhow!("unexpected websocket message type")),
        }
    }
}

impl TryFrom<Message> for WebsocketMessage {
    type Error = anyhow::Error;

    fn try_from(message: Message) -> Result<Self, Self::Error> {
        Ok(WebsocketMessage::Text(
            serde_json::to_string(&message).context("unable to serialize message to json")?,
        ))
    }
}
