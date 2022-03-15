use std::time::{UNIX_EPOCH, SystemTime, Duration};

use crate::{error::BoomerError, server::{socket::Socket, message::{MessageType, Message}}};

use self::{player::{Player, create_bullet_for_player}, game_queue::{GameQueue, MessageEnvelope}, bullet::Bullet, geometry::{AABB, Updatable}, game::Game};

pub mod test_utils;
pub mod bullet;
pub mod game;
pub mod game_setup;
pub mod player;
pub mod geometry;
pub mod game_queue;

async fn ready_players((mut s1, mut s2): (Socket, Socket)) -> Result<(Socket, Socket), BoomerError> {

    // We need to create the players and send off the fire command.
    s1.push(Message::new(MessageType::Fire)).await?;
    s2.push(Message::new(MessageType::Fire)).await?;

    return Ok((s1, s2));
}

async fn run_game_loop(mut sockets: (Socket, Socket)) -> Result<(Socket, Socket), BoomerError> {
    sockets = ready_players(sockets).await?;

    let mut game = Game::new(&mut sockets).await;
    game.run_loop().await?;

    return Ok(sockets);
}

pub async fn play_the_game((s1, s2): (Socket, Socket)) -> Result<(), BoomerError> {

    let sockets = game_setup::wait_for_ready(s1, s2).await?;
    let (mut s1, mut s2) = run_game_loop(sockets).await?;

    // Now we must play the game...
    //
    // So therefore once we reach this point we need to create the player object
    // that will keep track of the timing events for when the player is allowed
    // to fire.

    let res1 = s1.close().await;
    let res2 = s2.close().await;

    res1?;
    res2?;

    return Ok(());
}
