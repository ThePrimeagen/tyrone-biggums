use std::{fmt, net::SocketAddr};

pub struct GameResult {
    pub winner: SocketAddr,
    pub stats: GameStats,
}

#[derive(Debug, Default)]
pub struct GameStats {
    frame_buckets: [u128; 8],
}

impl GameStats {
    pub fn add_delta(&mut self, delta: u128) {
        if delta > 40_999 {
            self.frame_buckets[7] += 1;
        } else if delta > 30_999 {
            self.frame_buckets[6] += 1;
        } else if delta > 25_999 {
            self.frame_buckets[5] += 1;
        } else if delta > 23_999 {
            self.frame_buckets[4] += 1;
        } else if delta > 21_999 {
            self.frame_buckets[3] += 1;
        } else if delta > 19_999 {
            self.frame_buckets[2] += 1;
        } else if delta > 17_999 {
            self.frame_buckets[1] += 1;
        } else {
            self.frame_buckets[0] += 1;
        }
    }
}

impl fmt::Display for GameStats {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let s = self
            .frame_buckets
            .iter()
            .map(ToString::to_string)
            .collect::<Vec<String>>()
            .join(",");

        write!(f, "{}", s)
    }
}
