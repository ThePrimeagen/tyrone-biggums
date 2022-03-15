use std::sync::Arc;
use tokio::sync::{mpsc::channel, Mutex};
use crate::server::{message::{Message, GameMessage}, socket::Listenable};
use async_trait::async_trait;

type Rx = tokio::sync::mpsc::Receiver<Message>;
type MessageQueue = Arc<Mutex<Vec<MessageEnvelope>>>;

#[derive(Debug, PartialEq)]
pub struct MessageEnvelope {
    pub from: usize,
    pub msg: GameMessage
}

pub struct GameQueue {
    messages: MessageQueue,
    id1: u16,
    id2: u16,
}

async fn handle_socket_messages(mut rx1: Rx, mut rx2: Rx, queue: MessageQueue) {
    loop {
        tokio::select! {
            msg = rx1.recv() => {
                match msg {
                    Some(Message::Message(msg)) => {
                        queue.lock().await.push(MessageEnvelope {
                            from: 1,
                            msg: msg,
                        })
                    },
                    _ => {
                        println!("socket 1 appears to be closed.");
                        break;
                    }
                }
            }
            msg = rx2.recv() => {
                match msg {
                    Some(Message::Message(msg)) => {
                        queue.lock().await.push(MessageEnvelope {
                            from: 2,
                            msg: msg,
                        })
                    },
                    _ => {
                        println!("socket 2 appears to be closed.");
                        break;
                    }
                }
            }
        }
    }
}

impl GameQueue {
    pub async fn new<T>(s1: &mut T, s2: &mut T) -> GameQueue where T: Listenable {
        let (tx1, rx1) = channel::<Message>(2);
        let (tx2, rx2) = channel::<Message>(2);
        let messages = Arc::new(Mutex::new(Vec::new()));

        let id1 = s1.listen(tx1).await;
        let id2 = s2.listen(tx2).await;

        // TODO: How to get around this..?
        tokio::spawn(handle_socket_messages(rx1, rx2, messages.clone()));

        return GameQueue{
            messages,
            id1,
            id2,
        };
    }

    pub async fn flush(&mut self) -> Option<MessageQueue> {
        if self.messages.lock().await.is_empty() {
            return None;
        }

        let mut out = Arc::new(Mutex::new(Vec::new()));
        std::mem::swap(&mut out, &mut self.messages);

        return Some(out);
    }

    pub async fn detach_from_listeners<T: Listenable>(&self, s1: &mut T, s2: &mut T) {
        s1.off(self.id1).await;
        s2.off(self.id2).await;
    }
}

#[cfg(test)]
mod test {
    use crate::{error::BoomerError, server::message::MessageType, game::test_utils::Socket};
    use super::*;

    #[tokio::test]
    async fn test() -> Result<(), BoomerError> {
        let mut s1 = Socket::new();
        let mut s2 = Socket::new();
        let mut queue = GameQueue::new(&mut s1, &mut s2).await;

        tokio::time::sleep(std::time::Duration::from_millis(1)).await;

        let result = queue.flush().await;
        assert_eq!(result.is_none(), true);

        s1.listeners
            .lock()
            .await
            .get(0)
            .expect("there should be the queue as a listener")
            .send(Message::Message(GameMessage{
                r#type: MessageType::GameOver, msg: None
            })).await?;

        tokio::time::sleep(std::time::Duration::from_millis(1)).await;
        let result = queue.flush().await;
        if let Some(result) = result {
            assert_eq!(result.lock().await.len(), 1);
            assert_eq!(result.lock().await.get(0).unwrap(), &MessageEnvelope {
                from: 1,
                msg: GameMessage {
                    r#type: MessageType::GameOver, msg: None
                }
            });
        } else {
            assert_eq!(false, true);
        }

        let result = queue.flush().await;
        assert_eq!(result.is_none(), true);

        return Ok(());
    }
}



