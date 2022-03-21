use std::time::{SystemTime, UNIX_EPOCH};

use super::{bullet::{Bullet, BULLET_SPEED}, geometry::AABB};

pub struct Player {
    last_fired: u128,
    fire_rate: u128,
    dir_x: f64,
    dir_y: f64,
    pub aabb: AABB
}

pub const PLAYER_WIDTH: f64 = 100.0;
pub const PLAYER_HEIGHT: f64 = 3.0;
pub const PLAYER_STARTING_X: f64 = 2500.0;

impl Player {
    pub fn real_game_player(fire_rate: u128, dir_x: f64) -> Player {
        let aabb = if dir_x == -1.0 {
            AABB::new(PLAYER_STARTING_X, 0.0, PLAYER_WIDTH, PLAYER_HEIGHT)
        } else {
            AABB::new(-PLAYER_STARTING_X, 0.0, PLAYER_WIDTH, PLAYER_HEIGHT)
        };

        return Player {
            last_fired: 0,
            fire_rate,
            aabb,
            dir_x,

            dir_y: 0.0,
        }
    }

    pub fn new(fire_rate: u128, aabb: AABB, dir_x: f64) -> Player {
        return Player {
            last_fired: 0,
            fire_rate,
            aabb,
            dir_x,

            dir_y: 0.0,
        }
    }

    pub fn fire(&mut self) -> bool {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("come on").as_micros();

        if now - self.last_fired > self.fire_rate {
            return true;
        }

        return false;
    }
}

pub fn create_bullet_for_player(player: &Player) -> Bullet {
    let mut bullet: Bullet = if player.dir_x == 1.0 {
        let mut bullet = Bullet::from_aabb(player.aabb.clone());
        bullet.aabb.set_position(
            player.aabb.x + player.aabb.width + 1.0,
            0.0);
        bullet
    } else {
        let mut bullet = Bullet::from_aabb(player.aabb.clone());
        bullet.aabb.set_position(
            player.aabb.x - super::bullet::BULLET_WIDTH - 1.0,
            0.0);
        bullet
    };

    bullet.vel_x = player.dir_x * BULLET_SPEED;
    bullet.vel_y = player.dir_y * BULLET_SPEED;

    return bullet;
}

#[cfg(test)]
mod test {
    use crate::game::{geometry::AABB, player::{Player, create_bullet_for_player}, bullet::{BULLET_SPEED, BULLET_WIDTH}};

    #[test]
    fn test_bullet_create() {
        let mut player = Player::new(69, AABB::new(0.0, 0.0, 100.0, 100.0), 1.0);
        let bullet = create_bullet_for_player(&player);

        assert_eq!(bullet.aabb.x, player.aabb.x + player.aabb.width + 1.0);
        assert_eq!(bullet.vel_x, BULLET_SPEED);

        player.dir_x = -1.0;

        let bullet = create_bullet_for_player(&player);
        assert_eq!(bullet.aabb.x, player.aabb.x - BULLET_WIDTH - 1.0);
        assert_eq!(bullet.vel_x, -BULLET_SPEED);
    }

    #[test]
    fn test_real_player_creation() {
        let player = Player::real_game_player(69, -1.0);
        assert_eq!(player.aabb.x, 2500.0);

        let player = Player::real_game_player(69, 1.0);
        assert_eq!(player.aabb.x, -2500.0);
    }

}
