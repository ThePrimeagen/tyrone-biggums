use std::{
    ops::Deref,
    time::{SystemTime, UNIX_EPOCH},
};

use anyhow::Result;

use crate::{
    bullet::{Bullet, BULLET_SPEED, BULLET_WIDTH},
    geometry::Geometry,
};

pub const PLAYER_WIDTH: f64 = 100.0;
pub const PLAYER_HEIGHT: f64 = 3.0;
pub const PLAYER_STARTING_X: f64 = 2500.0;

pub struct Player {
    last_fired: u128,
    fire_rate: u128,
    dir_x: f64,
    dir_y: f64,
    geometry: Geometry,
}

impl Player {
    /// Creates a new player.
    pub fn new(fire_rate: u128, dir_x: f64) -> Self {
        let geometry = if dir_x == -1.0 {
            Geometry::new(PLAYER_STARTING_X, 0.0, PLAYER_WIDTH, PLAYER_HEIGHT)
        } else {
            Geometry::new(-PLAYER_STARTING_X, 0.0, PLAYER_WIDTH, PLAYER_HEIGHT)
        };

        Self {
            last_fired: 0,
            fire_rate,
            dir_x,
            dir_y: 0.0,
            geometry,
        }
    }

    /// Fires a bullet. Returns true if a bullet was fired.
    pub fn fire(&mut self) -> Result<bool> {
        let now = SystemTime::now().duration_since(UNIX_EPOCH)?.as_micros();

        if now - self.last_fired > self.fire_rate {
            self.last_fired = now;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// Creates a bullet for the player.
    pub fn create_bullet(&self) -> Bullet {
        let (x, y) = self.geometry.get_position();
        let (width, _) = self.geometry.get_dimensions();

        let mut bullet = Bullet::new(x, y);

        if self.dir_x == 1.0 {
            bullet.set_position(x + width + 1.0, 0.0);
        } else {
            bullet.set_position(x - BULLET_WIDTH - 1.0, 0.0);
        }

        bullet.with_velocity(self.dir_x * BULLET_SPEED, self.dir_y * BULLET_SPEED)
    }
}

impl Deref for Player {
    type Target = Geometry;

    fn deref(&self) -> &Self::Target {
        &self.geometry
    }
}

#[cfg(test)]
mod test {
    use super::*;

    impl Player {
        pub fn new_test(fire_rate: u128, geometry: Geometry, dir_x: f64) -> Player {
            Player {
                last_fired: 0,
                fire_rate,
                dir_x,
                dir_y: 0.0,
                geometry,
            }
        }
    }

    #[test]
    fn test_bullet_create() {
        let mut player = Player::new_test(69, Geometry::new(0.0, 0.0, 100.0, 100.0), 1.0);
        let bullet = player.create_bullet();

        assert_eq!(
            bullet.get_position().0,
            player.geometry.get_position().0 + player.geometry.get_dimensions().0 + 1.0
        );
        assert_eq!(bullet.get_velocity().0, BULLET_SPEED);

        player.dir_x = -1.0;

        let bullet = player.create_bullet();
        assert_eq!(
            bullet.get_position().0,
            player.geometry.get_position().0 - BULLET_WIDTH - 1.0
        );
        assert_eq!(bullet.get_velocity().0, -BULLET_SPEED);
    }

    #[test]
    fn test_real_player_creation() {
        let player = Player::new(69, -1.0);
        assert_eq!(player.geometry.get_position().0, 2500.0);

        let player = Player::new(69, 1.0);
        assert_eq!(player.geometry.get_position().0, -2500.0);
    }
}
