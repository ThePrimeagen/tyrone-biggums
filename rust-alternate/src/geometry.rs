#[derive(Debug, Clone, Copy)]
pub struct Geometry {
    x: f64,
    y: f64,
    width: f64,
    height: f64,
}

impl Geometry {
    /// Create a new geometry object.
    pub fn new(x: f64, y: f64, width: f64, height: f64) -> Self {
        Self {
            x,
            y,
            width,
            height,
        }
    }

    /// Returns the current position of geometry
    pub fn get_position(&self) -> (f64, f64) {
        (self.x, self.y)
    }

    /// Returns the dimensions of geometry
    pub fn get_dimensions(&self) -> (f64, f64) {
        (self.width, self.height)
    }

    /// Sets the geometry's x and y coordinates.
    pub fn set_position(&mut self, x: f64, y: f64) {
        self.x = x;
        self.y = y;
    }

    pub fn update_position(&mut self, delta_x: f64, delta_y: f64) {
        self.x += delta_x;
        self.y += delta_y;
    }

    /// Detects whether the geometry has collided with other.
    pub fn has_collided(&self, other: &Self) -> bool {
        self.x <= other.x + other.width
            && self.x + self.width >= other.x
            && self.y <= other.y + other.height
            && self.y + self.height >= other.y
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_geometry_collisions() {
        let a = Geometry::new(69.0, 420.0, 1337.0, 3.0);
        let b = Geometry::new(69.0 + 1338.0, 420.0, 1337.0, 3.0);
        let c = Geometry::new(69.0 + 1337.0, 420.0, 1337.0, 3.0);
        let d = Geometry::new(420.0, 420.0 + 4.0, 1337.0, 3.0);
        let e = Geometry::new(420.0, 420.0 + 3.0, 1337.0, 3.0);

        assert!(!a.has_collided(&b));
        assert!(a.has_collided(&c));
        assert!(!a.has_collided(&d));
        assert!(a.has_collided(&e));
    }
}
