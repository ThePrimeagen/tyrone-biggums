use std::{
    net::SocketAddr,
    sync::{atomic::AtomicUsize, Arc},
};

use anyhow::{Context, Result};
use tokio::{
    net::{TcpListener, TcpStream},
    task::JoinHandle,
};
use tokio_tungstenite::accept_async;
use tracing::{debug, info};

use crate::{connection::Connection, game::Game};

/// Bullet game server
pub struct Server {
    /// Port on which the server will listen on when started
    port: u16,
}

impl Server {
    /// Creates a new bullet game server
    pub fn new(port: u16) -> Self {
        Self { port }
    }

    /// Runs the bullet game server
    pub async fn run(&self) -> Result<()> {
        let addr = format!("127.0.0.1:{}", self.port);

        let listener = TcpListener::bind(addr)
            .await
            .context("failed to start game server")?;

        info!(port = self.port, "game server started");

        let mut other_connection: Option<Connection> = None;
        let active_games = Arc::new(AtomicUsize::default());

        while let Ok((stream, client_addr)) = listener.accept().await {
            let this_connection = accept_connection(stream, client_addr).await?;

            if other_connection.is_some() {
                start_game(
                    other_connection.take().unwrap(),
                    this_connection,
                    active_games.clone(),
                );
            } else {
                other_connection = Some(this_connection);
            }
        }

        Ok(())
    }
}

/// Accepts a websocket connection
async fn accept_connection(stream: TcpStream, client_addr: SocketAddr) -> Result<Connection> {
    debug!(?client_addr, "received connection");
    let ws_stream = accept_async(stream)
        .await
        .context("failed to accept websocket connection")?;

    Ok(Connection::new(client_addr, ws_stream))
}

/// Starts a new bullet game between two connections
fn start_game(
    first: Connection,
    second: Connection,
    active_games: Arc<AtomicUsize>,
) -> JoinHandle<()> {
    let first_addr = first.get_addr();
    let second_addr = second.get_addr();

    info!(
        ?first_addr,
        ?second_addr,
        "accepted client (both websocket connections received)"
    );

    let game = Game::new(first, second, active_games);
    game.spawn()
}
