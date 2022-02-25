package gameloop_test

import (
	"testing"

	gameloop "github.com/ThePrimeagen/tyrone-biggums/pkg/game_loop"
)

type Item struct {
    x float64
    y float64
    vel gameloop.Vector2D
}

func (i *Item) Update(xDelta, yDelta float64) {
    i.x += xDelta
    i.y += yDelta
}

func (i *Item) GetVelocity() *gameloop.Vector2D {
    return &i.vel
}

func createItem(x, y float64) *Item {
    return &Item{
        x,
        y,
        gameloop.Vector2D{1, 0},
    }
}

func TestUpdate(t *testing.T) {
    items := []*Item{
        createItem(0, 0),
        createItem(1, 1),
        createItem(2, 2),
        createItem(3, 3),
        createItem(4, 4),
    }

    gameloop.UpdateItems(items, 1)

    for i := 0; i < len(items); i++ {
        if items[i].x != (float64(i) + 1) {
            t.Errorf("Expected to have item[%v].x to have a position of %v but got %v", i, i + 1, items[i].x)
        }
    }
}

