use std::{
    collections::HashMap,
    sync::{Arc, Mutex}, slice::SliceIndex,
};

use log::{info, error};
use serde::Serialize;
use tokio::sync::mpsc::{unbounded_channel, UnboundedReceiver, UnboundedSender};

use crate::server::message::{Emitter, Message, ChatMessage};

type Tx = UnboundedSender<Vec<Message>>;
type Listeners = Arc<Mutex<Vec<Tx>>>;
type Channels = Arc<Mutex<HashMap<String, Vec<usize>>>>;
type LookupChannels = Arc<Mutex<HashMap<usize, String>>>;

#[derive(Debug, Serialize, Clone)]
struct ChannelMessage {
    pub channel_name: String,
    pub channel_user_count: usize,
    pub from: usize,
    pub msg: String
}

pub struct Chat {
    pub channels: Channels,
    listeners: Arc<Mutex<Vec<Tx>>>,
}

fn join(channels: &Channels, lookups: &LookupChannels, channel: &str, id: usize) {
    info!("join({}): {}", id, channel);
    channels
        .lock()
        .expect("channels lock should never fail")
        .entry(channel.to_string())
        .or_insert(vec![])
        .push(id);

    lookups
        .lock()
        .expect("locks shouldn't fail")
        .insert(id, channel.to_string());
}

fn leave_channels(channels: &Channels, lookups: &LookupChannels, id: usize) {
    info!("leaving channels");

    let channel = lookups
        .lock()
        .expect("locks shouldn't fail")
        .remove_entry(&id);

    if let None = channel {
        return
    }
    let id = &mut (id.clone());

    let channel = channel.unwrap().1;
    channels
        .lock()
        .expect("lock should never fail")
        .get_mut(&channel)
        .expect("lookups and channels should never be out of sync")
        .retain_mut(|x| x != id);
}

fn process_message(channels: &Channels, lookups: &LookupChannels, listeners: &Listeners, message: &ChatMessage) -> Result<(), serde_json::Error> {
    info!("process_message");

    let lookups = lookups
        .lock()
        .expect("locks shouldn't fail");

    if !lookups.contains_key(&message.id) {
        info!("unable to find a channel to send too, you must not be a part of a channel.");
        send_messages(vec![Message::from_chat_message(message.clone(), "You cannot send a message until you join a channel, you can join a channel with !join <channel name>".to_string())], listeners);
    }

    let channel = lookups.get(&message.id).unwrap();

    let channels = channels
        .lock()
        .expect("lock shouldn't fail");

    let channel_msg = serde_json::to_string(&ChannelMessage {
        channel_name: channel.to_string(),
        from: message.id,
        // todo: not sure how to prevent a 2x map lookup here
        channel_user_count: channels
            .get(channel)
            .expect("lookups shouldn't fail")
            .len(),
        msg: message.msg.clone(),
    })?;

    let msg = channels
        .get(channel)
        .expect("lookups shouldn't fail")
        .iter()
        .map(|id| Message::new(*id, channel_msg.clone()))
        .collect::<Vec<Message>>();

    send_messages(msg, listeners);
    return Ok(());
}

fn send_messages(messages: Vec<Message>, listeners: &Listeners) {
    let listeners = listeners.lock().expect("listeners lock should never fail");
    listeners
        .iter()
        .for_each(|tx| {
            info!("sending message: {:?}", messages);
            match tx.send(messages.clone()) {
                Err(e) => panic!("tx should never fail.. {:?}", e),
                _ => {}
            }
        });
}

async fn handle_messages(
    channels: Channels,
    lookups: LookupChannels,
    listeners: Listeners,
    mut rx: UnboundedReceiver<Message>,
) {
    while let Some(msg) = rx.recv().await {
        let msg = match msg {
            Message::Message(msg) => msg,
            Message::Close(id) => {
                leave_channels(&channels, &lookups, id);
                continue;
            }
        };

        let text = &msg.msg;
        if text.starts_with("!join") {
            let (_, channel) = text.split_once(" ").unwrap_or_else(|| ("", ""));

            leave_channels(&channels, &lookups, msg.id);
            join(&channels, &lookups, channel, msg.id);
        } else if text == ":q" {
            leave_channels(&channels, &lookups, msg.id);
        } else {
            match process_message(&channels, &lookups, &listeners, &msg) {
                Err(e) => {
                    error!("Error processing message: {:?} -- {:?}", msg, e);
                }
                Ok(_) => {
                }
            }
        }
    }
}

impl Chat {
    pub fn new<T: Emitter<Message>>(emitter: &mut T) -> Chat {
        let (tx, rx) = unbounded_channel::<Message>();
        emitter.listen(tx);

        let channels = Arc::new(Mutex::new(HashMap::new()));
        let lookups = Arc::new(Mutex::new(HashMap::new()));
        let listeners = Arc::new(Mutex::new(vec![]));

        tokio::spawn(handle_messages(channels.clone(), lookups.clone(), listeners.clone(), rx));

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
