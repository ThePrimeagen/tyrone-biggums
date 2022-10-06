package gameloop

import "time"

type IGameClock interface {
	Now() time.Time
}

type GameClock struct{}

func (g *GameClock) Now() time.Time {
	return time.Now()
}

type SyntheticGameClock struct {
	now time.Time
}

func (g *SyntheticGameClock) SetNow(now time.Time) {
	g.now = now
}

func (g *SyntheticGameClock) Now() time.Time {
	return g.now
}
