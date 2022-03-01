package gameloop_test

import (
	"testing"

	gameloop "github.com/ThePrimeagen/tyrone-biggums/pkg/game_loop"
)

func TestBulletCreate(t *testing.T) {
    pos := gameloop.Vector2D {0, 0}
    dir := gameloop.Vector2D {1, 0}
    fireRate := int64(69)
    player := gameloop.NewPlayer(pos, dir, fireRate)
    bullet := gameloop.CreateBulletFromPlayer(player, 69)

    if bullet.Geo.X != player.Geo.X + player.Geo.Width + 1 {
        t.Errorf("expected the x of the bullet to be to the positive side of the player")
    }

    if bullet.Vel[0] != 69 {
        t.Errorf("expected the velocity of the bullet to be 69")
    }

    player.Dir[0] = -1
    bullet = gameloop.CreateBulletFromPlayer(player, 59)
    if bullet.Geo.X != player.Geo.X - gameloop.BULLET_WIDTH - 1 {
        t.Errorf("expected the x of the bullet to be to the negative side of the player")
    }

    if bullet.Vel[0] != -59 {
        t.Errorf("expected the velocity of the bullet to be -59")
    }
}


