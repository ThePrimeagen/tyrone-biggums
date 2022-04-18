#![feature(vec_retain_mut)]

use std::sync::Arc;

use log::warn;
use rust::{
    server::server::{Server, handle_connection}, game::{play_the_game, ActiveGames},
};
use tokio::sync::Mutex;

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    env_logger::init();
    // console_subscriber::init();

    let mut server = Server::new().await?;
    warn!("starting server");

    let active_games = Arc::new(Mutex::new(ActiveGames::new()));

    let mut other_socket: Option<Socket> = None;
    while let Ok((stream, _)) = listener.accept().await {
        let socket = handle_connection(stream).await;
        if let Some(other_socket) = other_socket.take() {
            tokio::spawn(play_the_game((other_socket, socket), active_games.clone()));
        } else {
            other_socket = Some(socket);
        }
    }

    Ok(())
}
