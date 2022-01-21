use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

use log::info;
use tokio::sync::mpsc::{unbounded_channel, UnboundedReceiver, UnboundedSender};

use crate::server::message::{Emitter, Message};

type Tx = UnboundedSender<Vec<Message>>;
type Listeners = Arc<Mutex<Vec<Tx>>>;
type Channels = Arc<Mutex<HashMap<String, Vec<usize>>>>;

pub struct Chat {
    pub channels: Channels,
    listeners: Arc<Mutex<Vec<Tx>>>,
}

fn join(channels: &Channels, channel: &str, id: usize) {
    println!("join({}): {}", id, channel);
    channels
        .lock()
        .expect("channels lock should never fail")
        .entry(channel.to_string())
        .or_insert(vec![])
        .push(id);
}

fn leave_channels(channels: &Channels, id: usize) {
    println!("leaving channels");
    // If there was a id associated with each socket, I could just use this...
    for channel in channels
        .lock()
        .expect("channels lock should never fail")
        .values_mut()
    {
        channel.retain(|&x| x != id);
    }
}

fn process_message(channels: &Channels, listeners: &Listeners, message: &Message) {
    println!("process_message");

    let mut sent = false;
    for channel in channels
        .lock()
        .expect("channels lock should never fail")
        .values_mut()
    {
        if channel.contains(&message.id) {
            let msg = channel
                .iter()
                .map(|id| Message::new(*id, message.msg.clone()))
                .collect::<Vec<Message>>();
            send_messages(msg, listeners);
            sent = true;
            break;
        }
    }

    println!("sent? {}", sent);
    if !sent {
        println!("unable to find a channel to send too, you must not be a part of a channel.");
        send_messages(vec![Message::from_message(message.clone(), "You cannot send a message until you join a channel, you can join a channel with !join <channel name>".to_string())], listeners);
    }
}

fn send_messages(messages: Vec<Message>, listeners: &Listeners) {
    let listeners = listeners.lock().expect("listeners lock should never fail");
    listeners
        .iter()
        .for_each(|tx| {
            println!("sending message: {:?}", messages);
            match tx.send(messages.clone()) {
                Err(e) => panic!("tx should never fail.. {:?}", e),
                _ => {}
            }
        });
}

async fn handle_messages(
    channels: Channels,
    listeners: Listeners,
    mut rx: UnboundedReceiver<Message>,
) {
    while let Some(msg) = rx.recv().await {
        let text = &msg.msg;

        info!("handle_messages: {:?}", msg);
        if text.starts_with("!join") {
            let (_, channel) = text.split_once(" ").unwrap_or_else(|| ("", ""));

            leave_channels(&channels, msg.id);
            join(&channels, channel, msg.id);
        } else if text == ":q" {
            leave_channels(&channels, msg.id);
        } else {
            process_message(&channels, &listeners, &msg);
        }
    }
}

impl Chat {
    pub fn new<T: Emitter<Message>>(emitter: &mut T) -> Chat {
        let (tx, rx) = unbounded_channel::<Message>();
        emitter.listen(tx);

        let channels = Arc::new(Mutex::new(HashMap::new()));
        let listeners = Arc::new(Mutex::new(vec![]));

        tokio::spawn(handle_messages(channels.clone(), listeners.clone(), rx));

        return Chat {
            channels,
            listeners,
        };
    }
}

impl Emitter<Vec<Message>> for Chat {
    fn listen(&mut self, tx: UnboundedSender<Vec<Message>>) {
        self.listeners.lock().unwrap().push(tx);
    }
}
