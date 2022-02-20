/*
import WebSocket from "ws";
import { createMessage, Message, MessageType } from "../message";

function wait(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
}

function parseAndReportWinnerStats(winnerData: string) {
    const parts = winnerData.split("___");
    const activeGames = +parts[0].split("(")[1].split(")")[0];
    const buckets = parts[1].split(",").map(x => +x);

    console.log("Results", activeGames, JSON.stringify(buckets));
}

let countSend = 0;
function sendMessage(socket: WebSocket) {
    countSend++;
    if (countSend % 10000 === 0) {
        console.log("Sent 10000 Messages");
    }
    socket.send(fireMessage);
}

const fireMessage = JSON.stringify(createMessage(MessageType.Fire));
async function playTheGame(socket: WebSocket, fireRate: number, cb: (msg: Message) => void = () => {}) {
    let playing = false;
    socket.on("message", async function(message) {
        const msg = JSON.parse(message.toString()) as Message;
        cb(msg);
        switch (msg.type) {
            case MessageType.ReadyUp:
                socket.send(JSON.stringify(createMessage(MessageType.ReadyUp)))
                break;

            case MessageType.Play:
                playing = true;
                do {
                    sendMessage(socket);
                    await wait(fireRate);
                } while (playing);

                break;

            case MessageType.GameOver:
                if (msg.msg?.startsWith("winner")) {
                    parseAndReportWinnerStats(msg.msg);
                }
                playing = false;
                socket.close();
                break;

            default:
                // @ts-ignore
                console.log("DEFAULT???", msg.type, MessageType.ReadyUp, msg.type === MessageType.ReadyUp);
        }
    });
}

export function connect(fireRate: number, addr: string, port: number, cb: (msg: Message) => void = () => {}): WebSocket {
    const url = `ws://${addr}:${port}`;
    const socket = new WebSocket(url);

    socket.on("open", () => {
        playTheGame(socket, fireRate, cb);
    });

    return socket;
}

let _id = 0;
let MAX = process.env.MAX || 2;
function repeatConnect(addr: string, port: number, count: number = 0) {
    if (count >= MAX) {
        return;
    }

    const id = ++_id;
    const socket = connect(200,
            addr || "events.theprimeagen.tv",
            port || 42069, (msg: any) => {
                // console.log("GOT MSG", msg);
            });

    socket.on("close", () => {
        repeatConnect(addr, port, count + 1);
    });

    socket.on("error", (e) => {
        repeatConnect(addr, port, count + 1);
    });
}

if (require.main === module) {
    const count = +process.argv[2];
    const addr = process.argv[3];
    const port = +process.argv[4];

    async function run() {
        function wait(ms: number): Promise<void> {
            return new Promise(res => setTimeout(res, ms));
        }
        for (let i = 0; i < count; ++i) {
            await wait(50);
            repeatConnect(addr, port);
        }
    }

    run();
}
*/

use std::{time::{SystemTime, UNIX_EPOCH, Duration}, sync::Arc};

use futures::{StreamExt, SinkExt, pin_mut, stream::{SplitSink}};
use log::{info, error};
use rust::server::message::MessageType;
use serde::{Serialize, Deserialize};
use structopt::StructOpt;

use tokio::sync::Mutex;
use tokio_tungstenite::{connect_async, tungstenite::Message, WebSocketStream};
use url::Url;

#[derive(Debug, StructOpt, Clone)]
pub struct ServerOpts {
    /// Activate debug mode
    pub count: u16,

    /// The port to use for the events to be served on
    #[structopt(short = "h", long = "host", default_value = "0.0.0.0")]
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

async fn fire_loop(callees: Arc<Mutex<Vec<Vec<SplitStreamWrite>>>>) {
    let mut then = SystemTime::now().duration_since(UNIX_EPOCH).expect("come on").as_micros();
    let mut idx = 0;
    let msg = tokio_tungstenite::tungstenite::Message::Text(
        serde_json::to_string(&rust::server::message::Message::new(MessageType::Fire))
            .expect("Fire message has to be successfully stringified"));

    loop {
        let now = SystemTime::now().duration_since(UNIX_EPOCH).expect("come on").as_micros();
        let diff = now - then;
        if diff < 1000 {
            tokio::time::sleep(Duration::from_micros(diff as u64)).await;
        }

        let now = SystemTime::now().duration_since(UNIX_EPOCH).expect("come on").as_micros();

        let mut awaits = vec![];
        let mut callees = callees.lock().await;
        let callee = callees.get_mut(idx).expect("this idx has to exist");

        for writer in callee {
            awaits.push(writer.send(msg.clone()));
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

async fn connect(url: Url) -> (SplitStreamWrite, SplitStreamRead) {
    let (ws_stream, _) = connect_async(url).await.expect("Failed to connect");
    return ws_stream.split();
}

fn get_max() -> usize {
    return str::parse(&std::env::var("MAX").unwrap_or("100".to_string())).unwrap_or(100);
}

async fn play(url: Url, count: usize) {
    let max = get_max();
    if count >= max {
        return;
    }

    let (write, read) = connect(url).await;
}

#[tokio::main]
async fn main() {
    env_logger::init();
    let opts = ServerOpts::from_args();
    let url = url::Url::parse(format!("ws://{}:{}{}", opts.host, opts.port, opts.path).as_str()).unwrap();

    // NOTE: wont let me do shorthand... [vec![]; 41]
    let mut writers: [Vec<SplitStreamWrite>; 200] = [vec![]; 200];
    let mut connections_to_make = vec![];

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

