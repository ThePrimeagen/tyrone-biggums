use std::time::{SystemTime, UNIX_EPOCH, Duration};

use crate::error::BoomerError;

use super::{player::{Player, create_bullet_for_player}, bullet::Bullet, geometry::Updatable, game_queue::GameQueue, stats::GameStats};

use crate::server::socket::Listenable;

#[derive(Debug, PartialEq)]
pub enum PlayerIdx {
    One,
    Two,
}

impl TryInto<usize> for PlayerIdx {
    type Error = BoomerError;
    fn try_into(self) -> Result<usize, Self::Error> {
        return match self {
            PlayerIdx::One => Ok(0),
            PlayerIdx::Two => Ok(1),
        }
    }
}

pub struct Game {
    pub current_bullets: Vec<Bullet>,
    pub game_ended: bool,
    pub loser: Option<PlayerIdx>,

    players: [Player; 2],
    queue: GameQueue,
}

impl Game {
    pub async fn new<T>(sockets: &mut (T, T)) -> Game where T: Listenable {
        // create the players.
        let players: [Player; 2] = [
            Player::real_game_player(180_000, -1.0),
            Player::real_game_player(350_000, 1.0),
        ];

        let queue = GameQueue::new(&mut sockets.0, &mut sockets.1).await;

        return Game {
            players,
            current_bullets: Vec::new(),
            game_ended: false,
            queue,
            loser: None,
        }
    }

    async fn empty_message_queue(&mut self) {
        let msgs = self.queue.flush().await;

        if let Some(msgs) = msgs {
            for msg in msgs.lock().await.iter() {
                let player = &mut self.players[msg.from - 1];
                if player.fire() {
                    self.current_bullets.push(
                        create_bullet_for_player(player)
                    );
                }
            }
        }
    }

    fn update_bullets(&mut self, diff: u128) {
        for bullet in self.current_bullets.iter_mut() {
            bullet.update(diff);
        }
    }

    fn check_for_collisions(&mut self) {
        if self.current_bullets.len() == 0 {
            return;
        }

        let mut i = (self.current_bullets.len() - 1) as isize;
        'outer_loop: while i >= 0 {
            let mut j = (i - 1) as isize;
            let a = self.current_bullets.get(i as usize).expect("this should always exist");

            while j >= 0 {
                let b = self.current_bullets.get(j as usize).expect("this should always exist");
                if a.aabb.has_collision(&b.aabb) {
                    self.current_bullets.remove(i as usize);
                    self.current_bullets.remove(j as usize);
                    break 'outer_loop;
                }

                j -= 1;
            }

            i -= 1;
        }
    }

    fn check_for_collisions_with_players(&mut self) -> Option<PlayerIdx> {
        let mut out = None;
        for bullet in &self.current_bullets {
            if self.players[0].aabb.has_collision(&bullet.aabb) {
                out = Some(PlayerIdx::One);
                break;
            }
            if self.players[1].aabb.has_collision(&bullet.aabb) {
                out = Some(PlayerIdx::Two);
                break;
            }
        }

        return out;
    }

    pub async fn run_loop(&mut self) -> Result<GameStats, BoomerError> {

        let mut last_loop = SystemTime::now().duration_since(UNIX_EPOCH).expect("come on").as_micros();
        let mut stats = GameStats::new();
        let mut interval = tokio::time::interval(Duration::from_millis(16));

        loop {
            // 5.   sleep for up to 16.66ms
            //
            interval.tick().await; // first tick is 0ms

            let start = SystemTime::now().duration_since(UNIX_EPOCH).expect("come on").as_micros();
            let diff = start - last_loop;
            stats.add_delta(diff);

            // 1.  check the message queue
            self.empty_message_queue().await;

            // 2. update all the bullets
            self.update_bullets(diff);

            // 3.  check for collisions
            self.check_for_collisions();

            // 3b.  check for player bullet collisions..
            // kind of shitty way to do things, but hey, we are the shitty way of doing things
            // startup
            let player_hit = self.check_for_collisions_with_players();

            if player_hit.is_some() {
                // 4.  Stop the loop if game is over
                self.game_ended = true;
                self.loser = player_hit;
                break;
            }

            last_loop = start;
        }

        return Ok(stats);
    }
}

#[cfg(test)]
mod test {
    use std::sync::Arc;

    use tokio::sync::Mutex;

    use crate::{game::{test_utils::{Socket, TxList}, bullet::BULLET_WIDTH, player::{PLAYER_STARTING_X, PLAYER_WIDTH}}, server::message::Message};

    use super::*;

    async fn wait_for_message_queue_to_empty() {
        tokio::time::sleep(Duration::from_millis(69)).await;
    }

    async fn fire(listener: TxList) -> Result<(), BoomerError> {
        for listener in listener.lock().await.iter() {
            listener.send(Message::new(crate::server::message::MessageType::Fire)).await?;
        }

        return Ok(());
    }

    const BULLET_STARTING_POS_0: f64 = PLAYER_STARTING_X - BULLET_WIDTH - 1.0;
    const BULLET_STARTING_POS_1: f64 = -PLAYER_STARTING_X + PLAYER_WIDTH + 1.0;

    #[tokio::test]
    async fn test_bullet_generation() -> Result<(), BoomerError> {

        let mut sockets = (Socket::new(), Socket::new());
        let listeners = (
            sockets.0.listeners.clone(), sockets.1.listeners.clone()
        );

        let mut game = Game::new(&mut sockets).await;

        fire(listeners.0).await?;
        wait_for_message_queue_to_empty().await;
        game.empty_message_queue().await;

        assert_eq!(game.current_bullets.len(), 1);
        assert_eq!(game.current_bullets.get(0).expect("exists").aabb.x,
            BULLET_STARTING_POS_0);

        fire(listeners.1).await?;
        wait_for_message_queue_to_empty().await;
        game.empty_message_queue().await;

        assert_eq!(game.current_bullets.len(), 2);
        assert_eq!(game.current_bullets.get(1).expect("exists").aabb.x,
            BULLET_STARTING_POS_1);

        return Ok(());

    }

    #[tokio::test]
    async fn test_collisions() -> Result<(), BoomerError> {
        let mut sockets = (Socket::new(), Socket::new());
        let listeners = (
            sockets.0.listeners.clone(), sockets.1.listeners.clone()
        );

        let mut game = Game::new(&mut sockets).await;
        fire(listeners.0).await?;
        fire(listeners.1).await?;
        wait_for_message_queue_to_empty().await;

        game.empty_message_queue().await;
        game.check_for_collisions();
        assert_eq!(game.current_bullets.len(), 2);

        let diff = f64::abs(BULLET_STARTING_POS_1 - BULLET_STARTING_POS_0);
        let update_time = diff / 2.0 * 1000.0; // MICROSECONDS DUMMY

        game.update_bullets(update_time as u128);
        game.check_for_collisions();
        assert_eq!(game.current_bullets.len(), 0);

        return Ok(());
    }

    #[tokio::test]
    async fn test_for_player_collisions() -> Result<(), BoomerError> {
        let mut sockets = (Socket::new(), Socket::new());
        let listeners = (
            sockets.0.listeners.clone(), sockets.1.listeners.clone()
        );

        let mut game = Game::new(&mut sockets).await;
        fire(listeners.0).await?;
        wait_for_message_queue_to_empty().await;

        game.empty_message_queue().await;
        assert_eq!(game.current_bullets.len(), 1);

        let diff = f64::abs(-PLAYER_STARTING_X - BULLET_STARTING_POS_0);
        let update_time = diff * 1000.0; // MICROSECONDS DUMMY

        game.update_bullets(update_time as u128 - ((PLAYER_WIDTH + 1.0) * 1000.0) as u128);
        game.check_for_collisions();
        assert_eq!(game.current_bullets.len(), 1);

        let player_idx = game.check_for_collisions_with_players();
        assert_eq!(player_idx, None);

        game.update_bullets(1000);
        let player_idx = game.check_for_collisions_with_players();
        assert_eq!(player_idx, Some(PlayerIdx::Two));

        return Ok(());
    }

    #[tokio::test]
    async fn test_the_whole_game() -> Result<(), BoomerError> {
        let mut sockets = (Socket::new(), Socket::new());
        let mut game = Game::new(&mut sockets).await;
        let listener1 = sockets.0.listeners.clone();
        let listener2 = sockets.1.listeners.clone();
        // TODO: Come back to this.
        // NOTE: Keeping it
        let kill: Arc<Mutex<Vec<usize>>> = Arc::new(Mutex::new(vec![]));

        let inner_kill = kill.clone();
        tokio::spawn(async move {
            loop {
                // HACKTEVISION,
                if inner_kill.lock().await.len() == 1 {
                    break;
                }
                fire(listener1.clone()).await;
                fire(listener2.clone()).await;
                tokio::time::sleep(Duration::from_millis(200)).await;
            }
        });

        match game.run_loop().await {
            Err(e) => {
                println!("Game failed for this reason {:?}", e);
                unreachable!(e);
            },
            _ => {}
        }
        kill.lock().await.push(0);

        assert_eq!(game.loser.is_some(), true);
        assert_eq!(game.loser.unwrap(), PlayerIdx::Two);

        return Ok(());
    }
}

