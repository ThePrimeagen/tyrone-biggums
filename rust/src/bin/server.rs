#![feature(vec_retain_mut)]

use rust::{
    chat::Chat,
    server::{message::{Receiver}, server::Server},
};

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    env_logger::init();

    let mut server = Server::new().await?;
    let mut chat = Chat::new(&mut server);

    server.receive(&mut chat);
    server.join_handle.await?;

    return Ok(());
}
