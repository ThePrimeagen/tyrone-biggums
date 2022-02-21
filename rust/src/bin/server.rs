#![feature(vec_retain_mut)]

use log::warn;
use rust::{
    server::server::Server, game::{play_the_game},
};

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    env_logger::init();

    let mut server = Server::new().await?;
    warn!("starting server");
    let receiver = server.get_receiver();

    tokio::spawn(async move {
        let mut receiver = receiver.unwrap();
        while let Some(two_sockets) = receiver.recv().await {
            tokio::spawn(play_the_game(two_sockets));
        }
    });

    server.join_handle.await?;

    return Ok(());
}
