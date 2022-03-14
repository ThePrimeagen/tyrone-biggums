use crate::{error::BoomerError, server::{socket::Socket, message::{MessageType, Message}}};

use self::{player::{Player, create_bullet_for_player}, game_queue::{GameQueue, MessageEnvelope}, bullet::Bullet, geometry::AABB};

pub mod bullet;
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
    // create the players.
    let players: [Player; 2] = [
        Player::real_game_player(180, -1.0),
        Player::real_game_player(350, 1.0),
    ];

    // ready the players
    sockets = ready_players(sockets).await?;

    let mut queue = GameQueue::new(&mut sockets.0, &mut sockets.1).await;
    let currentBullets: Vec<Bullet> = Vec::new();

    loop {
        // 1.  check the message queue
        let msgs = queue.flush().await;

        if let Some(msgs) = msgs {
            for msg in msgs.lock().await.iter() {
                let bullet = create_bullet_for_player(&players[msg.from - 1]);
            }
        }

        // 2. update all the bullets
        // 3.  check for collisions
        // 3b.  check for player bullet collisions..
        // 4.  Stop the loop if game is over
        // 5.   sleep for up to 16.66ms

    }


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

