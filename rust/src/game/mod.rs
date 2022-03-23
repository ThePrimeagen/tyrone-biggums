use std::{time::{UNIX_EPOCH, SystemTime, Duration}, sync::Arc};

use tokio::sync::Mutex;

use crate::{error::BoomerError, server::{socket::Socket, message::{MessageType, Message}}};

use self::{player::{Player, create_bullet_for_player}, game_queue::{GameQueue, MessageEnvelope}, bullet::Bullet, geometry::{AABB, Updatable}, game::{Game, PlayerIdx}, stats::GameStats};

pub mod stats;
pub mod test_utils;
pub mod bullet;
pub mod game;
pub mod game_setup;
pub mod player;
pub mod geometry;
pub mod game_queue;

async fn ready_players((mut s1, mut s2): (Socket, Socket)) -> Result<(Socket, Socket), BoomerError> {

    // We need to create the players and send off the fire command.
    s1.push(Message::new(MessageType::Play)).await?;
    s2.push(Message::new(MessageType::Play)).await?;

    return Ok((s1, s2));
}

async fn run_game_loop(mut sockets: (Socket, Socket)) -> Result<(Socket, Socket, GameStats), BoomerError> {
    sockets = ready_players(sockets).await?;

    let mut game = Game::new(&mut sockets).await;
    let stats = game.run_loop().await?;

    if let Some(PlayerIdx::One) = game.loser {
        return Ok((sockets.0, sockets.1, stats));
    } else if let Some(PlayerIdx::Two) = game.loser {
        return Ok((sockets.1, sockets.0, stats));
    }

    return Err(BoomerError::PlayerNoneError());
}

pub struct ActiveGames {
    active_games: usize
}

impl ActiveGames {
    pub fn new() -> ActiveGames {
        return ActiveGames {
            active_games: 0,
        };
    }
    pub fn add_active_game(&mut self) {
        self.active_games += 1;
    }

    pub fn remove_active_game(&mut self) {
        self.active_games -= 1
    }
}

pub async fn play_the_game((s1, s2): (Socket, Socket), active_games: Arc<Mutex<ActiveGames>>) -> Result<(), BoomerError> {

    let sockets = match game_setup::wait_for_ready(s1, s2).await {
        Ok(s) => s,
        Err(_) => return Ok(())
    };

    active_games.lock().await.add_active_game();

    let (mut loser, mut winner, stats) = match run_game_loop(sockets).await {
        Ok(s) => s,
        Err(e) => {
            println!("Error while running game_loop {:?}", e);
            active_games.lock().await.remove_active_game();
            return Ok(());
        },
    };

    // Now we must play the game...
    //
    // So therefore once we reach this point we need to create the player object
    // that will keep track of the timing events for when the player is allowed
    // to fire.
    //
    let output_str: String;
    {
        let mut active_games = active_games.lock().await;
        output_str = format!("winner({})___{}", active_games.active_games, <GameStats as Into<std::string::String>>::into(stats));
        active_games.remove_active_game();
    }

    let (r1, r2) = futures::future::join(
        loser.push(Message::with_message(MessageType::GameOver, "loser".to_string())),
        winner.push(Message::with_message(MessageType::GameOver, output_str)),
    ).await;

    let (r3, r4) = futures::future::join(
        loser.close(),
        winner.close(),
    ).await;

    r1?;
    r2?;
    r3?;
    r4?;

    return Ok(());
}

