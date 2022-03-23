pub struct GameStats {
    frame_buckets: [u128; 8]
}

impl GameStats {
    pub fn new() -> GameStats {
        return GameStats {
            frame_buckets: [0; 8],
        };
    }

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

impl Into<String> for GameStats {
    fn into(self) -> String {
        return self.frame_buckets
            .iter()
            .map(|x| x.to_string())
            .collect::<Vec<String>>()
            .join(",");
    }
}


