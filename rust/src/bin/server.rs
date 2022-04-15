#![feature(vec_retain_mut)]

use std::sync::Arc;

use log::warn;
use rust::{
    server::server::Server, game::{play_the_game, ActiveGames},
};
use tokio::sync::Mutex;

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    env_logger::init();
    // console_subscriber::init();

    let mut server = Server::new().await?;
    warn!("starting server");
    let receiver = server.get_receiver();

    let mut receiver = receiver.unwrap();
    let active_games = Arc::new(Mutex::new(ActiveGames::new()));
    while let Some(two_sockets) = receiver.recv().await {
        tokio::spawn(play_the_game(two_sockets, active_games.clone()));
    }

    server.join_handle.await?;

    return Ok(());
}
