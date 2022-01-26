use std::{sync::{Arc, Mutex}, time::{SystemTime, UNIX_EPOCH, Duration}};

use futures::{StreamExt, SinkExt, pin_mut, future, stream::{SplitSink, ForEach}};
use log::{info, error};
use serde::{Serialize, Deserialize};
use structopt::StructOpt;
use tokio::io::AsyncWriteExt;
use tokio_tungstenite::{connect_async, tungstenite::Message, WebSocketStream};
use url::Url;

#[derive(Debug, Serialize, Deserialize)]
struct MessageContent {
    inc: usize,
    msg: String,
    ts: u128,
}

#[derive(Debug, Deserialize)]
struct ChatMessage {
    channel_name: String,
    channel_user_count: usize,
    from: usize,
    msg: MessageContent,
}

#[derive(Debug, StructOpt, Clone)]
pub struct ServerOpts {
    /// Activate debug mode
    pub count: u16,

    /// The port to use for the events to be served on
    pub host: String,

    /// The address to use.  Should be 0.0.0.0
    #[structopt(short = "p", long = "port", default_value = "42069")]
    pub port: u16,

    /// The address to use.  Should be 0.0.0.0
    #[structopt(long = "path", default_value = "/")]
    pub path: String,
}

type SplitStreamWrite = SplitSink<WebSocketStream<tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>>, Message>;
type SplitStreamRead = futures::stream::SplitStream<WebSocketStream<tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>>>;

async fn connect(url: Url, offset: usize, chat_room: String) -> (usize, SplitStreamRead, SplitStreamWrite) {
    tokio::time::sleep(Duration::from_millis(offset as u64)).await;

    info!("connecting {}", url);
    let (ws_stream, _) = connect_async(url).await.expect("Failed to connect");
    let (mut write, mut read) = ws_stream.split();

    let msg = Message::Text(format!("!join {}", chat_room));
    match write.send(msg).await {
        Err(e) => panic!("Failed to write join {:?}", e),
        _ => {}
    }

    let mut id = 0usize;
    while let Some(Ok(msg)) = read.next().await {
        let str = msg.into_text().expect("str");
        if str.starts_with("!join successful") {
            id = str.split_once(": ").expect("': ' must exist").1.parse::<usize>().expect("to be number");
            break;
        }
    }

    return (id, read, write)
}

async fn process_reader(id: usize, read: SplitStreamRead) {
    read.for_each(|message| async move {
        let str = message.unwrap().into_text().expect("str");
        let data: ChatMessage = serde_json::from_str(&str).expect("to always win");
        if data.from == id {
            let now = SystemTime::now().duration_since(UNIX_EPOCH).expect("come on").as_micros();
            let diff = now - data.msg.ts as u128;
            println!("TIME,{}", diff);
        }
    }).await
}

async fn process_writers(mut writer_set: [Vec<SplitStreamWrite>; 41]) {
    let mut then = SystemTime::now().duration_since(UNIX_EPOCH).expect("come on").as_micros();
    let mut idx = 0;
    loop {
        let now = SystemTime::now().duration_since(UNIX_EPOCH).expect("come on").as_micros();
        let diff = now - then;
        if diff < 100000 {
            tokio::time::sleep(Duration::from_millis(diff as u64)).await;
        } else {
            error!("EXCEEDING TIME!! FAILING")
        }

        let now = SystemTime::now().duration_since(UNIX_EPOCH).expect("come on").as_micros();
        let msg = serde_json::to_string(&MessageContent {
            ts: now,
            msg: "Hello, World".to_string(),
            inc: 68
        }).expect("to work");

        let mut awaits = vec![];
        for writer in writer_set[idx % 41].iter_mut() {
            let msg = Message::Text(msg.clone());
            awaits.push(writer.send(msg));
        }

        futures::future::join_all(awaits).await.iter().for_each(|x| {
            match x {
                Err(e) => panic!("Failed to write join {:?}", e),
                _ => {}
            }
        });

        then = now;
        idx += 1;
    }
}

#[tokio::main]
async fn main() {
    env_logger::init();
    let opts = ServerOpts::from_args();
    let url = url::Url::parse(format!("ws://{}:{}{}", opts.host, opts.port, opts.path).as_str()).unwrap();

    let chat: [&str; 20] = [
        "foo0",
        "foo1",
        "foo2",
        "foo3",
        "foo4",
        "foo5",
        "foo6",
        "foo7",
        "foo8",
        "foo9",
        "foo10",
        "foo11",
        "foo12",
        "foo13",
        "foo14",
        "foo15",
        "foo16",
        "foo17",
        "foo18",
        "foo19",
    ];

    // NOTE: wont let me do shorthand... [vec![]; 41]
    let mut writers: [Vec<SplitStreamWrite>; 41] = [
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
    ];

    let mut connects = vec![];
    for i in 0..(opts.count as usize) {
        let chat_room = chat[i % chat.len()];
        connects.push(connect(url.clone(), i * 5, chat_room.to_string()));
    }

    let mut awaits = vec![];
    futures::future::join_all(connects).await.into_iter().enumerate().for_each(|(idx, (id, read, write))| {
        awaits.push(process_reader(id, read));
        writers[idx % 41].push(write);
    });

    let future_people = process_writers(writers);
    let future_readers = futures::future::join_all(awaits);
    pin_mut!(future_people, future_readers);
    futures::future::select(
        future_people, future_readers
    ).await;
}

