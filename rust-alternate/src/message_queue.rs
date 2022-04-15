use std::{
    net::SocketAddr,
    ops::{Deref, DerefMut},
};

use futures_util::StreamExt;
use tokio::{
    sync::mpsc::{unbounded_channel, UnboundedReceiver},
    task::JoinHandle,
};

use crate::{connection::ConnectionReadHalf, message::Message};

pub struct MessageQueue {
    receiver: UnboundedReceiver<(SocketAddr, Message)>,
    first_handle: JoinHandle<()>,
    second_handle: JoinHandle<()>,
}

impl MessageQueue {
    pub fn new(mut first: ConnectionReadHalf, mut second: ConnectionReadHalf) -> Self {
        let (sender, receiver) = unbounded_channel::<(SocketAddr, Message)>();

        let first_sender = sender.clone();
        let second_sender = sender;

        let first_handle = tokio::spawn(async move {
            let addr = first.get_addr();

            while let Some(Ok(message)) = first.next().await {
                if first_sender.send((addr, message)).is_err() {
                    break;
                }
            }
        });

        let second_handle = tokio::spawn(async move {
            let addr = second.get_addr();

            while let Some(Ok(message)) = second.next().await {
                if second_sender.send((addr, message)).is_err() {
                    break;
                }
            }
        });

        Self {
            receiver,
            first_handle,
            second_handle,
        }
    }

    pub fn close(self) {
        self.first_handle.abort();
        self.second_handle.abort();
    }
}

impl Deref for MessageQueue {
    type Target = UnboundedReceiver<(SocketAddr, Message)>;

    fn deref(&self) -> &Self::Target {
        &self.receiver
    }
}

impl DerefMut for MessageQueue {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.receiver
    }
}
