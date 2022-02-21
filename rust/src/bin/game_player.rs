use core::time;
use std::{time::{SystemTime, UNIX_EPOCH, Duration}, sync::Arc, collections::HashMap, hash::{Hash, Hasher}};

use futures::{StreamExt, SinkExt, stream::SplitSink, future::join_all, pin_mut};

use rust::{server::message::{MessageType, Message}, error::BoomerError};

use structopt::StructOpt;

use tokio::sync::Mutex;
use tokio_tungstenite::{connect_async, WebSocketStream, tungstenite};
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

    /// The address to use.  Should be 0.0.0.0
    #[structopt(short = "c", long = "connections")]
    pub connection_count: Option<usize>,
}

pub struct ServerConfig {
    /// Activate debug mode
    pub count: u16,
    pub host: String,
    pub port: u16,
    pub path: String,
    pub connection_count: usize,
}

impl ServerConfig {
    fn new(opts: ServerOpts) -> ServerConfig {
        return ServerConfig {
            count: opts.count,
            host: opts.host,
            port: opts.port,
            path: opts.path,
            connection_count: opts.connection_count.expect("connection_count should be set by some default value before creating the server config"),
        }
    }
}

const WRITE_COUNT: usize = 40;
type SplitStreamWrite = SplitSink<WebSocketStream<tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>>, tungstenite::Message>;
type SplitStreamRead = futures::stream::SplitStream<WebSocketStream<tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>>>;

struct HashableWriter {
    writer: SplitStreamWrite,
    id: usize,
}

impl PartialEq for HashableWriter {
    fn eq(&self, other: &Self) -> bool {
        return self.id == other.id;
    }
}

impl Eq for HashableWriter {}

impl Hash for HashableWriter {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.id.hash(state);
    }
}

type WriteArray = [HashMap<usize, HashableWriter>; WRITE_COUNT];
type AMVWrite = Arc<Mutex<WriteArray>>;

const TIME_BETWEEN_LOOPS: u64 = 5000;
async fn fire_loop(callees: AMVWrite) -> Result<(), BoomerError> {
    let mut then = SystemTime::now().duration_since(UNIX_EPOCH).expect("come on").as_micros();
    let mut idx = 0;
    let msg: tungstenite::Message = Message::new(MessageType::Fire).try_into()?;
    println!("msg to be sent: {}", msg);

    loop {
        let now = SystemTime::now().duration_since(UNIX_EPOCH).expect("come on").as_micros();
        let diff = now - then;
        if diff < TIME_BETWEEN_LOOPS.into() {
            let sleep_time = TIME_BETWEEN_LOOPS.saturating_sub(diff as u64);
            tokio::time::sleep(Duration::from_micros(sleep_time)).await;
        } else {
            println!("unable to send messages within {} us", TIME_BETWEEN_LOOPS);
        }

        let now = SystemTime::now().duration_since(UNIX_EPOCH).expect("come on").as_micros();

        let callees = &mut callees.lock().await[idx % WRITE_COUNT];

        // todo: this may not be fast enough.  We may have to spawn several of these.
        for writer in callees.iter_mut() {
            writer.1.writer.send(msg.clone()).await?;
        }

        then = now;
        idx += 1;
    }
}

async fn connect(url: Url, id: usize) -> (HashableWriter, SplitStreamRead) {
    let (ws_stream, _) = connect_async(url).await.expect("Failed to connect");
    let (write, read) = ws_stream.split();

    return (
        HashableWriter {writer: write, id},
        read,
    )
}

fn get_connection_count() -> usize {
    return str::parse(&std::env::var("CONNECTION_COUNT").expect("There has to be a connection count set in either the cli args or through env vars.")).expect("connection count to be a number");
}

async fn next_message(read: &mut SplitStreamRead) -> Result<Option<Message>, BoomerError> {
    // wait for the readyup
    let next = read.next().await;
    if let Some(Ok(tungstenite::Message::Text(msg))) = next {
        let msg: Message = msg.try_into()?;
        return Ok(Some(msg));
    }
    return Ok(None);
}

async fn send_ready(writer: &mut HashableWriter) -> Result<(), BoomerError> {
    let msg: tungstenite::Message = Message::new(MessageType::ReadyUp).try_into()?;

    writer.writer.send(msg).await?;
    return Ok(());
}

async fn play(url: Url, id: usize, writers: AMVWrite, config: Arc<Mutex<ServerConfig>>, offset: usize) -> Result<(), BoomerError> {
    // helps prevent 500 connections at once then for games to be played in huge spirts...
    // seems unrealistic.
    tokio::time::sleep(Duration::from_millis(offset as u64)).await;
    while config.lock().await.count > 0 {
        {
            config.lock().await.count -= 1;
        }

        if config.lock().await.count % 500 == 0 {
            println!("{} games left to play", config.lock().await.count);
        }

        let (mut write, mut read) = connect(url.clone(), id).await;

        // TODO: there has to be better way...
        if let Ok(Some(Message::Message(msg))) = next_message(&mut read).await {
            if let MessageType::ReadyUp = msg.r#type {
                send_ready(&mut write).await?;
            } else {
                return Err(BoomerError::PlayerReadyUpError);
            }
        } else {
            return Err(BoomerError::PlayerReadyUpError);
        }

        // TODO: there has to be better way...
        if let Ok(Some(Message::Message(msg))) = next_message(&mut read).await {
            if let MessageType::Play = msg.r#type {
            } else {
                return Err(BoomerError::PlayerFireCommand);
            }
        } else {
            return Err(BoomerError::PlayerFireCommand);
        }

        writers.lock().await[id % WRITE_COUNT].insert(id, write);

        // TODO: there has to be better way...
        if let Ok(Some(Message::Message(msg))) = next_message(&mut read).await {
            if let MessageType::GameOver = msg.r#type {
                if let Some(msg) = msg.msg {
                    if msg.starts_with("winner") {
                        println!("{}", msg);
                    }
                }
            } else {
                return Err(BoomerError::PlayerGameOver);
            }
        } else {
            return Err(BoomerError::PlayerGameOver);
        }

        {
            let mut writer = writers.lock().await;
            writer[id % WRITE_COUNT].remove(&id);
        }
    }

    return Ok(());
}

async fn kill(url: Url) -> Result<(), BoomerError> {
    let (mut write, mut read) = connect(url.clone(), 0).await;
    return Ok(());
}

fn get_config() -> Arc<Mutex<ServerConfig>> {
    let mut opts = ServerOpts::from_args();
    if opts.connection_count.is_none() {
        opts.connection_count = Some(get_connection_count());
    }

    return Arc::new(Mutex::new(ServerConfig::new(opts)));
}

#[tokio::main]
async fn main() -> Result<(), BoomerError> {
    env_logger::init();

    let opts = get_config();
    let url: Url;
    {
        let opts = opts.lock().await;
        url = url::Url::parse(format!("ws://{}:{}{}", opts.host, opts.port, opts.path).as_str()).unwrap();
    }

    let maps = create_maps();
    let writers: AMVWrite = Arc::new(Mutex::new(maps));
    let fire_loop_await = fire_loop(writers.clone());

    let mut awaits = vec![];
    let connection_count = opts.lock().await.connection_count;
    for i in 0..connection_count {
        awaits.push(play(url.clone(), i, writers.clone(), opts.clone(), i * 50));
    }
    println!("created {} players", connection_count);

    // TODO: don't care... should I?
    pin_mut!(fire_loop_await);
    match futures::future::select(
        join_all(awaits),
        fire_loop_await
    ).await {
        _ => {}
    }
    println!("done.");

    return Ok(());
}

fn create_maps() -> [HashMap<usize, HashableWriter>; WRITE_COUNT] {
    // todo: clearly research macros.......
    return [
        HashMap::new(),
        HashMap::new(),
        HashMap::new(),
        HashMap::new(),

        HashMap::new(),
        HashMap::new(),
        HashMap::new(),
        HashMap::new(),

        HashMap::new(),
        HashMap::new(),
        HashMap::new(),
        HashMap::new(),

        HashMap::new(),
        HashMap::new(),
        HashMap::new(),
        HashMap::new(),

        HashMap::new(),
        HashMap::new(),
        HashMap::new(),
        HashMap::new(),

        HashMap::new(),
        HashMap::new(),
        HashMap::new(),
        HashMap::new(),

        HashMap::new(),
        HashMap::new(),
        HashMap::new(),
        HashMap::new(),

        HashMap::new(),
        HashMap::new(),
        HashMap::new(),
        HashMap::new(),

        HashMap::new(),
        HashMap::new(),
        HashMap::new(),
        HashMap::new(),

        HashMap::new(),
        HashMap::new(),
        HashMap::new(),
        HashMap::new(),
    ];

}
