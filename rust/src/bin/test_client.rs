use std::{sync::{Arc, Mutex}, time::{SystemTime, UNIX_EPOCH, Duration}};

use futures::{StreamExt, SinkExt, pin_mut, future};
use serde::{Serialize, Deserialize};
use structopt::StructOpt;
use tokio::io::AsyncWriteExt;
use tokio_tungstenite::{connect_async, tungstenite::Message};
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

async fn connect(url: Url, offset: usize, chat_room: String) {
    let (ws_stream, _) = connect_async(url).await.expect("Failed to connect");
    println!("WebSocket handshake has been successfully completed");
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

    let reader = read.for_each(|message| async {
        let str = message.unwrap().into_text().expect("str");
        let data: ChatMessage = serde_json::from_str(&str).expect("to always win");
        if data.from == id {
            let now = SystemTime::now().duration_since(UNIX_EPOCH).expect("come on").as_micros();
            let diff = now - data.msg.ts as u128;
            println!("TIME,{}", diff);
        }
    });

    let writer = tokio::spawn(async move {
        tokio::time::sleep(Duration::from_millis(offset as u64)).await;
        loop {
            tokio::time::sleep(Duration::from_millis(2000)).await;
            let now = SystemTime::now().duration_since(UNIX_EPOCH).expect("come on").as_micros();
            let msg = serde_json::to_string(&MessageContent {
                ts: now,
                msg: "Hello, World".to_string(),
                inc: 68
            }).expect("to work");
            match write.send(Message::Text(msg)).await {
                Err(e) => panic!("Failed to write join {:?}", e),
                _ => {}
            }
        }
    });

    pin_mut!(reader, writer);
    future::select(reader, writer).await;
}

#[tokio::main]
async fn main() {
    let opts = ServerOpts::from_args();
    let url = url::Url::parse(format!("ws://{}:{}{}", opts.host, opts.port, opts.path).as_str()).unwrap();

    let chat: [&str; 10] = [
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
    ];

    let initial_waits: [usize; 41] = [
        0,
        50,
        100,
        150,
        200,
        250,
        300,
        350,
        400,
        450,
        500,
        550,
        600,
        650,
        700,
        750,
        800,
        850,
        900,
        950,
        1000,
        1050,
        1100,
        1150,
        1200,
        1250,
        1300,
        1350,
        1400,
        1450,
        1500,
        1550,
        1600,
        1650,
        1700,
        1750,
        1800,
        1850,
        1900,
        1950,
        2000,
    ];

    let mut awaits = vec![];
    for i in 0..opts.count {
        let offset = initial_waits[(i % 41) as usize];
        let chat_room = chat[(i % 10) as usize];
        awaits.push(connect(url.clone(), offset, chat_room.to_string()));
    }

    futures::future::join_all(awaits).await;
}

