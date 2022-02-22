package gameloop

type Player struct {
    Geo AABB
    Dir Vector2D
    FireRate uint
}

type Bullet struct {
    Geo AABB
    Vel Vector2D
}

const PLAYER_WIDTH = 100
const PLAYER_HEIGHT = 100
const BULLET_WIDTH = 35
const BULLET_HEIGHT = 3


func NewPlayer(pos, dir Vector2D, fireRate uint) Player {
    return Player {
        Geo: AABB {
            X: pos[0],
            Y: pos[1],
            Width: PLAYER_WIDTH,
            Height: PLAYER_HEIGHT,
        },
        Dir: dir,
        FireRate: fireRate,
    }
}

func newBullet() Bullet {
    return Bullet {
        AABB {0, 0, BULLET_WIDTH, BULLET_HEIGHT},
        Vector2D {0, 0},
    }
}

func CreateFromPlayer(player Player, speed float64) Bullet {
    bullet := newBullet()

    if player.Dir[0] == 1 {
        bullet.Geo.SetPosition(
            player.Geo.X + player.Geo.Width + 1,
            0);
    } else {
        bullet.Geo.SetPosition(
            player.Geo.X - BULLET_WIDTH - 1,
            0);
    }

    bullet.Vel[0] = player.Dir[0] * speed;
    bullet.Vel[1] = player.Dir[1] * speed;

    return bullet
}

