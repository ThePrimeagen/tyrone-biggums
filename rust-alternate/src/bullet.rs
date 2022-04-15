use std::ops::{Deref, DerefMut};

use tracing::trace;

use crate::geometry::Geometry;

pub const BULLET_WIDTH: f64 = 35.0;
pub const BULLET_HEIGHT: f64 = 3.0;
pub const BULLET_SPEED: f64 = 1.0;

#[derive(Debug, Clone, Copy)]
pub struct Bullet {
    geometry: Geometry,
    velocity_x: f64,
    velocity_y: f64,
}

impl Bullet {
    /// Creates a new bullet.
    pub fn new(x: f64, y: f64) -> Self {
        Self {
            geometry: Geometry::new(x, y, BULLET_WIDTH, BULLET_HEIGHT),
            velocity_x: 0.0,
            velocity_y: 0.0,
        }
    }

    /// Adds velocity to the bullet.
    pub fn with_velocity(mut self, velocity_x: f64, velocity_y: f64) -> Self {
        self.velocity_x = velocity_x;
        self.velocity_y = velocity_y;
        self
    }

    /// Returns velocity of the bullet.
    #[cfg(test)]
    pub fn get_velocity(&self) -> (f64, f64) {
        (self.velocity_x, self.velocity_y)
    }

    /// Updates position of bullet based on velocity and delta
    pub fn update(&mut self, delta: f64) {
        let delta_x = self.velocity_x * (delta / 1000.0);
        let delta_y = self.velocity_y * (delta / 1000.0);

        trace!(delta_x, delta_y, "updating bullet position");

        self.geometry.update_position(delta_x, delta_y);
    }
}

impl Deref for Bullet {
    type Target = Geometry;

    fn deref(&self) -> &Self::Target {
        &self.geometry
    }
}

impl DerefMut for Bullet {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.geometry
    }
}

impl From<Geometry> for Bullet {
    fn from(geometry: Geometry) -> Self {
        Self {
            geometry,
            velocity_x: 0.0,
            velocity_y: 0.0,
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn update_bullets_position() {
        let mut bullet = Bullet::new(0.0, 1.0).with_velocity(-1.0, 0.0);

        bullet.update(16000.0);
        assert_eq!(bullet.geometry.get_position(), (-16.0, 1.0));

        let mut bullet = Bullet::new(1.0, -2.0).with_velocity(-1.0, 1.0);

        bullet.update(16000.0);
        assert_eq!(bullet.geometry.get_position(), (-15.0, 14.0));
    }
}
