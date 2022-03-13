use super::geometry::{AABB, Updatable};

 //where is my aabb?
pub struct Bullet {
    aabb: AABB,
    dir_x: f64,
    dir_y: f64,
}

pub const BULLET_SPEED: f64 = 1.0;
const BULLET_WIDTH: f64 = 35.0;
const BULLET_HEIGHT: f64 = 3.0;

impl Bullet {
    pub fn new(x: f64, y: f64, dir_x: f64, dir_y: f64) -> Bullet {
        return Bullet {
            aabb: AABB::new(x, y, BULLET_WIDTH, BULLET_HEIGHT),
            dir_x,
            dir_y,
        }
    }
}

impl Updatable for Bullet {
    fn update(&mut self, delta: u128) {
        self.aabb.x += (delta as f64) * self.dir_x;
        self.aabb.y += (delta as f64) * self.dir_y;
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn update_bullets_position() {
        let mut bullet = Bullet::new(0.0, 1.0, -1.0, 0.0);

        bullet.update(16);
        assert_eq!(bullet.aabb.x, -16.0);
        assert_eq!(bullet.aabb.y, 1.0);

        let mut bullet = Bullet::new(1.0, -2.0, -1.0, 1.0);

        bullet.update(16);
        assert_eq!(bullet.aabb.x, -15.0);
        assert_eq!(bullet.aabb.y, 14.0);
    }
}
