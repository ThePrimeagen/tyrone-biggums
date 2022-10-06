package gameloop

import (
	"time"
)

type Player struct {
	Geo          AABB
	Dir          Vector2D
	FireRate     int64
	lastFireTime int64
	clock        IGameClock
}

type Bullet struct {
	Geo AABB
	Vel Vector2D
}

const PLAYER_WIDTH = 100
const PLAYER_HEIGHT = 100
const BULLET_WIDTH = 35
const BULLET_HEIGHT = 3

func NewPlayer(pos, dir Vector2D, fireRate int64) *Player {
	return &Player{
		Geo: AABB{
			X:      pos[0],
			Y:      pos[1],
			Width:  PLAYER_WIDTH,
			Height: PLAYER_HEIGHT,
		},
		Dir:          dir,
		FireRate:     fireRate,
		lastFireTime: 0,
		clock:        &GameClock{},
	}
}

func NewPlayerWithClock(pos, dir Vector2D, fireRate int64, clock IGameClock) *Player {
	return &Player{
		Geo: AABB{
			X:      pos[0],
			Y:      pos[1],
			Width:  PLAYER_WIDTH,
			Height: PLAYER_HEIGHT,
		},
		Dir:          dir,
		FireRate:     fireRate,
		lastFireTime: 0,
		clock:        clock,
	}
}

func (p *Player) Fire() bool {
	now := time.Now().UnixMilli()

	if p.FireRate > now-p.lastFireTime {
		return false
	}

	p.lastFireTime = now
	return true
}

func newBullet() Bullet {
	return Bullet{
		AABB{0, 0, BULLET_WIDTH, BULLET_HEIGHT},
		Vector2D{0, 0},
	}
}

func CreateBulletFromPlayer(player *Player, speed float64) Bullet {
	bullet := newBullet()

	if player.Dir[0] == 1 {
		bullet.Geo.SetPosition(
			player.Geo.X+player.Geo.Width+1,
			0)
	} else {
		bullet.Geo.SetPosition(
			player.Geo.X-BULLET_WIDTH-1,
			0)
	}

	bullet.Vel[0] = player.Dir[0] * speed
	bullet.Vel[1] = player.Dir[1] * speed

	return bullet
}

func (b *Bullet) Update(xDelta, yDelta float64) {
	b.Geo.X += xDelta
	b.Geo.Y += yDelta
}
