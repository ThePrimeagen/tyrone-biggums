use std::{sync::{atomic::{Ordering}}, time::Duration};


use tokio::{sync::mpsc::{channel, Receiver}};

use crate::{error::BoomerError, server::{socket::Socket, message::{Message, MessageType}}, kill::{Timeout}};

async fn wait_for_ready_received(mut rx: Receiver<Message>) {
    while let Some(msg) = rx.recv().await {
        match msg {
            Message::Message(m) => {
                if let MessageType::ReadyUp = m.r#type {
                    break;
                }
            },
            _ => {}
        }
    }
}

pub async fn wait_for_ready(mut s1: Socket, mut s2: Socket) -> Result<(Socket, Socket), BoomerError> {

    s1.push(Message::new(MessageType::ReadyUp)).await?;
    s2.push(Message::new(MessageType::ReadyUp)).await?;

    let (tx1, rx1) = channel::<Message>(2);
    let (tx2, rx2) = channel::<Message>(2);

    let id1 = s1.listen(tx1).await;
    let id2 = s2.listen(tx2).await;

    let ready1 = tokio::spawn(wait_for_ready_received(rx1));
    let ready2 = tokio::spawn(wait_for_ready_received(rx2));
    let mut timeout = Timeout::new();

    tokio::select! {
        _ = futures::future::join(ready1, ready2) => { },
        _ = timeout.timeout(Duration::from_secs(30)) => { }
    }

    timeout.finish().await;

    if timeout.timedout.load(Ordering::Relaxed) {
        return Err(BoomerError::TimeoutOnReady)
    }

    s1.off(id1).await;
    s2.off(id2).await;

    return Ok((s1, s2));
}
