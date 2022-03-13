pub struct AABB {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

pub trait Updatable {
    fn update(&mut self, delta: u128);
}

impl AABB {
    pub fn new(x: f64, y: f64, width: f64, height: f64) -> AABB {
        return AABB { x, y, width, height };
    }

    pub fn has_collision(&self, other: &AABB) -> bool {
        if self.x > other.x + other.width || other.x > self.x + self.width {
            return false;
        }

        if self.y > other.y + other.height || other.y > self.y + self.height {
            return false;
        }

        return true;
    }

    pub fn has_collision_fast(&self, other: &AABB, width: f64) -> bool {
        return f64::abs(self.x - other.x) < width;
    }
}

#[cfg(test)]
mod test {
    use super::*;


    #[test]
    fn aabb_collision() {
        let a = AABB::new(
            69.0,
            420.0,
            1337.0,
            3.0,
        );

        let b = AABB::new(
            69.0 + 1338.0,
            420.0,
            1337.0,
            3.0,
        );

        let c = AABB::new(
            69.0 + 1337.0,
            420.0,
            1337.0,
            3.0,
        );

        let d = AABB::new(
            420.0,
            420.0 + 4.0,
            1337.0,
            3.0,
        );

        let e = AABB::new(
            420.0,
            420.0 + 3.0,
            1337.0,
            3.0,
        );

        assert_eq!(a.has_collision(&b), false);
        assert_eq!(a.has_collision(&c), true);
        assert_eq!(a.has_collision(&d), false);
        assert_eq!(a.has_collision(&e), true);
    }
}


