use std::{
    collections::{HashMap, VecDeque},
    net::SocketAddr,
    sync::{
        atomic::{AtomicUsize, Ordering},
        Arc,
    },
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use anyhow::{anyhow, Context, Result};
use tokio::{
    sync::mpsc::error::TryRecvError,
    task::JoinHandle,
    time::{interval, timeout},
};
use tracing::{debug, error, info, trace};

use crate::{
    bullet::Bullet,
    connection::{Connection, ConnectionReadHalf},
    game_result::{GameResult, GameStats},
    message_queue::MessageQueue,
    player::Player,
};

pub struct Game {
    first: Connection,
    second: Connection,
    active_games: Arc<AtomicUsize>,
}

impl Game {
    /// Creates a new bullet game between two connections
    pub fn new(first: Connection, second: Connection, active_games: Arc<AtomicUsize>) -> Self {
        Self {
            first,
            second,
            active_games,
        }
    }

    /// Spawns the bullet game in a separate async task
    pub fn spawn(self) -> JoinHandle<()> {
        tokio::spawn(async move {
            let active_games = self.active_games.clone();

            // Add a counter to the active games
            active_games.fetch_add(1, Ordering::SeqCst);

            // Run the game
            if let Err(err) = self.run().await {
                error!(?err, "game ended with error");
            }

            // Remove a counter from the active games
            active_games.fetch_sub(1, Ordering::SeqCst);
        })
    }

    /// Runs the bullet game
    async fn run(mut self) -> Result<()> {
        // Perform initial `ReadyUp` handshake with both connections
        timeout(Duration::from_secs(30), self.ready_up())
            .await
            .context("connection `ready_up` timed out")?
            .context("connections `ready_up` failed")?;

        trace!("successful ready_up handshake");

        // Send `Play` message to both connections (can do it concurrently but that would be a bit overkill)
        self.first.play().await?;
        self.second.play().await?;

        trace!("successfully sent `Play` messages");

        // Split the connections in two parts (stream and sink)
        let (first_receiver, mut first_sender) = self.first.split();
        let (second_receiver, mut second_sender) = self.second.split();

        // Play the game
        let result = play(first_receiver, second_receiver).await?;

        // Send `GameOver` message to both connections
        if first_sender.get_addr() == result.winner {
            first_sender
                .send_winner(&result.stats, self.active_games.load(Ordering::SeqCst))
                .await?;
            second_sender.send_loser().await?;
        } else {
            first_sender.send_loser().await?;
            second_sender
                .send_winner(&result.stats, self.active_games.load(Ordering::SeqCst))
                .await?;
        }

        // Close both the connections
        first_sender.close().await?;
        second_sender.close().await?;

        Ok(())
    }

    /// Performs initial `ReadyUp` handshake with both connections
    async fn ready_up(&mut self) -> Result<()> {
        // Send `ReadyUp` message to both connections (can do it concurrently but that would be a bit overkill)
        self.first.ready_up().await?;
        self.second.ready_up().await?;

        // Wait for `ReadyUp` messages from both connections (can do it concurrently but that would be a bit overkill)
        self.first.wait_ready_up().await?;
        self.second.wait_ready_up().await?;

        Ok(())
    }
}

async fn play(first: ConnectionReadHalf, second: ConnectionReadHalf) -> Result<GameResult> {
    let first_addr = first.get_addr();
    let second_addr = second.get_addr();

    let mut last_loop = SystemTime::now().duration_since(UNIX_EPOCH)?.as_micros();

    let mut stats = GameStats::default();

    let mut players = prepare_player_map(first_addr, second_addr);

    let mut bullets = HashMap::new();
    bullets.insert(first_addr, VecDeque::new());
    bullets.insert(second_addr, VecDeque::new());

    let mut message_queue = MessageQueue::new(first, second);

    let mut connected = true;

    let mut interval = interval(Duration::from_millis(16));

    while connected {
        // Sleep for 16 ms
        interval.tick().await;

        // Update the game stats
        let start = SystemTime::now().duration_since(UNIX_EPOCH)?.as_micros();
        let diff = start - last_loop;
        stats.add_delta(diff);
        last_loop = start;

        trace!(?diff, "microseconds between loops");

        // Receive all the messages from both connections
        loop {
            match message_queue.try_recv() {
                Ok((addr, _message)) => {
                    // TODO: Check message contents?

                    let player = players
                        .get_mut(&addr)
                        .context("unable to find player in players map")?;

                    if player.fire()? {
                        trace!(player_addr = ?addr, "player fired bullet");

                        let bullets = bullets
                            .get_mut(&addr)
                            .context("unable to find bullets in bullets map")?;
                        bullets.push_back(player.create_bullet());
                    }
                }
                Err(TryRecvError::Empty) => break,
                Err(TryRecvError::Disconnected) => {
                    connected = false;
                }
            }
        }

        // Update bullets with diff
        for (_, bullets) in bullets.iter_mut() {
            for bullet in bullets {
                bullet.update(diff as f64); // TODO: lossless conversion
            }
        }

        // Check if any of the bullets hit the other bullets and remve them
        remove_bullet_collisions(&mut bullets, first_addr, second_addr)?;

        // Check if any of the bullets hit the other players
        let winner =
            check_bullet_collision_with_players(&players, &bullets, first_addr, second_addr)?;

        // Return if there is a winner
        if let Some(winner) = winner {
            info!(?winner, "game ended with winner");
            message_queue.close();
            return Ok(GameResult { winner, stats });
        }

        trace!(?first_addr, ?second_addr, ?stats, "going to next tick");
    }

    Err(anyhow!("connection disconnected without winner"))
}

fn prepare_player_map(
    first_addr: SocketAddr,
    second_addr: SocketAddr,
) -> HashMap<SocketAddr, Player> {
    let first_player = Player::new(180_000, -1.0);
    let second_player = Player::new(350_000, 1.0);

    let mut players = HashMap::with_capacity(2);

    players.insert(first_addr, first_player);
    players.insert(second_addr, second_player);

    players
}

fn remove_bullet_collisions(
    bullets: &mut HashMap<SocketAddr, VecDeque<Bullet>>,
    first_addr: SocketAddr,
    second_addr: SocketAddr,
) -> Result<()> {
    let mut to_remove = 0;

    // Find the number of bullets to remove from each player's bullet queue
    {
        let mut first_bullets = bullets
            .get(&first_addr)
            .context("unable to find first player bullets")?
            .iter();
        let mut second_bullets = bullets
            .get(&second_addr)
            .context("unable to find first player bullets")?
            .iter();

        while let (Some(first_bullet), Some(second_bullet)) =
            (first_bullets.next(), second_bullets.next())
        {
            if first_bullet.has_collided(second_bullet) {
                trace!("bullet collision detected");
                to_remove += 1;
            } else {
                break;
            }
        }
    }

    // Remove bullets from first player's queue
    {
        let first_bullets = bullets
            .get_mut(&first_addr)
            .context("unable to find first player bullets")?;

        for _ in 0..to_remove {
            trace!("removing bullet from first player");
            first_bullets.pop_front();
        }
    }

    // Remove bullets from second player's queue
    {
        let second_bullets = bullets
            .get_mut(&second_addr)
            .context("unable to find first player bullets")?;

        for _ in 0..to_remove {
            trace!("removing bullet from second player");
            second_bullets.pop_front();
        }
    }

    Ok(())
}

fn check_bullet_collision_with_players(
    players: &HashMap<SocketAddr, Player>,
    bullets: &HashMap<SocketAddr, VecDeque<Bullet>>,
    first_addr: SocketAddr,
    second_addr: SocketAddr,
) -> Result<Option<SocketAddr>> {
    // Check collision of first player with front bullet of second player
    let first_player = players
        .get(&first_addr)
        .context("unable to find first player")?;
    let second_player = players
        .get(&second_addr)
        .context("unable to find second player")?;

    let first_bullet = bullets
        .get(&first_addr)
        .context("unable to find first player bullets")?
        .front();
    let second_bullet = bullets
        .get(&second_addr)
        .context("unable to find second player bullets")?
        .front();

    if let Some(second_bullet) = second_bullet {
        if first_player.has_collided(second_bullet) {
            debug!("first player collided with bullet");
            return Ok(Some(second_addr));
        }
    }

    if let Some(first_bullet) = first_bullet {
        if second_player.has_collided(first_bullet) {
            debug!("second player collided with bullet");
            return Ok(Some(first_addr));
        }
    }

    Ok(None)
}
