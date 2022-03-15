use std::time::{SystemTime, UNIX_EPOCH, Duration};

use crate::error::BoomerError;

use super::{player::{Player, create_bullet_for_player}, bullet::Bullet, geometry::Updatable, game_queue::GameQueue};

use crate::server::socket::Listenable;


enum PlayerIdx {
    None,
    One,
    Two,
}

impl TryInto<usize> for PlayerIdx {
    type Error = BoomerError;
    fn try_into(self) -> Result<usize, Self::Error> {
        return match self {
            PlayerIdx::One => Ok(0),
            PlayerIdx::Two => Ok(1),
            _ => Err(BoomerError::PlayerNoneError()),
        }
    }
}

pub struct Game {
    pub current_bullets: Vec<Bullet>,
    pub game_ended: bool,

    players: [Player; 2],
    loser: PlayerIdx,
    queue: GameQueue,
}

impl Game {
    pub async fn new<T>(sockets: &mut (T, T)) -> Game where T: Listenable {
        // create the players.
        let players: [Player; 2] = [
            Player::real_game_player(180, -1.0),
            Player::real_game_player(350, 1.0),
        ];

        let queue = GameQueue::new(&mut sockets.0, &mut sockets.1).await;

        return Game {
            players,
            current_bullets: Vec::new(),
            game_ended: false,
            queue,
            loser: PlayerIdx::None,
        }
    }

    async fn empty_message_queue(&mut self) {
        let msgs = self.queue.flush().await;

        if let Some(msgs) = msgs {
            for msg in msgs.lock().await.iter() {
                self.current_bullets.push(
                    create_bullet_for_player(&self.players[msg.from - 1])
                );
            }
        }
    }

    fn update_bullets(&mut self, diff: u128) {
        for bullet in self.current_bullets.iter_mut() {
            bullet.update(diff);
        }
    }

    fn check_for_collisions(&mut self) {
        let i = (self.current_bullets.len() - 1) as isize;
        'outer_loop: while i >= 0 {
            let j = (i - 1) as isize;
            let a = self.current_bullets.get(i as usize).expect("this should always exist");

            while j >= 0 {
                let b = self.current_bullets.get(j as usize).expect("this should always exist");
                if a.aabb.has_collision(&b.aabb) {
                    self.current_bullets.remove(i as usize);
                    self.current_bullets.remove(j as usize);
                    break 'outer_loop;
                }
            }
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

    pub async fn run_loop(&mut self) -> Result<(), BoomerError> {

        let mut last_loop = SystemTime::now().duration_since(UNIX_EPOCH).expect("come on").as_micros();

        loop {
            let start = SystemTime::now().duration_since(UNIX_EPOCH).expect("come on").as_micros();
            let diff = start - last_loop;
            // stats.add_delta(diff)

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

            if let Some(idx) = player_hit {
                // 4.  Stop the loop if game is over
                self.game_ended = true;
                self.loser = idx;
                break;
            }

            // 5.   sleep for up to 16.66ms
            //
            last_loop = start;
            let now = SystemTime::now().duration_since(UNIX_EPOCH).expect("come on").as_micros();
            tokio::time::sleep(Duration::from_micros(16_666u64 - (now - start) as u64)).await;
        }

        return Ok(());
    }
}

#[cfg(test)]
mod test {
    use crate::game::test_utils::Socket;

    use super::*;

    #[tokio::test]
    async fn test_bullet_collisions() {
        let mut sockets = (Socket::new(), Socket::new());

        let mut game = Game::new(&mut sockets).await;
        let join_handle = tokio::spawn(async move {
            return game.run_loop().await;
        });

        let result = join_handle.await;
    }
}

