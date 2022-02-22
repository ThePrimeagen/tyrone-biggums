package gameloop_test

import (
    "testing"
	gameloop "github.com/ThePrimeagen/tyrone-biggums/pkg/game_loop"
)

func TestAABBCollision(t *testing.T) {
    a := gameloop.AABB {
        X: 69,
        Y: 420,
        Width: 1337,
        Height: 3,
    }

    b := gameloop.AABB {
        X: 69 + 1338,
        Y: 420,
        Width: 1337,
        Height: 3,
    }

    c := gameloop.AABB {
        X: 69 + 1337,
        Y: 420,
        Width: 1337,
        Height: 3,
    }

    d := gameloop.AABB {
        X: 420,
        Y: 420 + 4,
        Width: 1337,
        Height: 3,
    }

    e := gameloop.AABB {
        X: 420,
        Y: 420 + 3,
        Width: 1337,
        Height: 3,
    }

    if a.HasCollision(&b) {
        t.Errorf("a should not collide with b")
    }

    if !a.HasCollision(&c) {
        t.Errorf("a should collide with c")
    }

    if a.HasCollision(&d) {
        t.Errorf("a should not collide with d")
    }

    if !a.HasCollision(&e) {
        t.Errorf("a should collide with e")
    }
}


