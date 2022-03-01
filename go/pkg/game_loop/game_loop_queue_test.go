package gameloop_test

import (
	"testing"
	"time"

	gameloop "github.com/ThePrimeagen/tyrone-biggums/pkg/game_loop"
	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
)

func TestMessageQueueFire(t *testing.T) {

    // TODO: This doesn't feel right... utils... test..?
    game, sockets, _ := NewGameComponents()

    gameloop.Game_startGame(game)

    fire := server.CreateMessage(server.Fire)
    sockets[0].inBound <- fire
    sockets[1].inBound <- fire

    // TODO: LEET CODER
    time.Sleep(time.Millisecond)

    gameloop.Game_updateStateFromMessageQueue(game)
    bullets := gameloop.GetGameBullets(game)

    if len(bullets) != 2 {
        t.Errorf("Expected to have 2 bullet but got %v", len(bullets))
    }

    sockets[0].inBound <- fire
    sockets[1].inBound <- fire

    gameloop.Game_updateStateFromMessageQueue(game)
    bullets = gameloop.GetGameBullets(game)

    if len(bullets) != 2 {
        t.Errorf("Expected to have 2 bullet but got %v", len(bullets))
    }
}


