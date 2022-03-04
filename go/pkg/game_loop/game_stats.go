package gameloop

type GameStat struct {
    frameBuckets [8]int64
    activeGames uint
}

func NewGameStat() *GameStat {
    return &GameStat {
        frameBuckets: [8]int64{0, 0, 0, 0, 0, 0, 0, 0},
    }
}

func (g *GameStat) AddDelta(delta int64) {
    if (delta > 40_999) {
        g.frameBuckets[7] += 1
    } else if (delta > 30_999) {
        g.frameBuckets[6] += 1
    } else if (delta > 25_999) {
        g.frameBuckets[5] += 1
    } else if (delta > 23_999) {
        g.frameBuckets[4] += 1
    } else if (delta > 21_999) {
        g.frameBuckets[3] += 1
    } else if (delta > 19_999) {
        g.frameBuckets[2] += 1
    } else if (delta > 17_999) {
        g.frameBuckets[1] += 1
    } else {
        g.frameBuckets[0] += 1
    }
}

