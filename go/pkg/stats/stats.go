package stats

import "sync"

var ActiveGames uint
var mutex sync.Mutex

func AddActiveGame() {
    mutex.Lock()
    ActiveGames += 1
    mutex.Unlock()
}

func RemoveActiveGame() {
    mutex.Lock()
    ActiveGames -= 1
    mutex.Unlock()
}

type GameStats struct {
    FrameBuckets [8]int64
}

func NewGameStat() *GameStats {
    return &GameStats {
        FrameBuckets: [8]int64{0, 0, 0, 0, 0, 0, 0, 0},
    }
}

func (g *GameStats) AddDelta(delta int64) {
    if (delta > 40_999) {
        g.FrameBuckets[7] += 1
    } else if (delta > 30_999) {
        g.FrameBuckets[6] += 1
    } else if (delta > 25_999) {
        g.FrameBuckets[5] += 1
    } else if (delta > 23_999) {
        g.FrameBuckets[4] += 1
    } else if (delta > 21_999) {
        g.FrameBuckets[3] += 1
    } else if (delta > 19_999) {
        g.FrameBuckets[2] += 1
    } else if (delta > 17_999) {
        g.FrameBuckets[1] += 1
    } else {
        g.FrameBuckets[0] += 1
    }
}


