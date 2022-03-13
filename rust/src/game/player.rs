use std::time::{SystemTime, UNIX_EPOCH};

pub struct Player {
    last_fired: u128,
    fire_rate: u128,
}

impl Player {
    pub fn new(fire_rate: u128) -> Player {
        return Player {
            last_fired: 0,
            fire_rate,
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
