#![feature(vec_retain_mut)]

use rust::{
    chat::Chat,
    server::{message::{Receiver}, server::Server},
};

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    env_logger::init();

    let mut server = Server::new().await?;
    let receiver = server.get_receiver();

    tokio::spawn(async move {
        while let Some(msg) = receiver.recv().await {
            println!("{:?}", msg);
        }
    });

    server.join_handle.await?;

    return Ok(());
}
