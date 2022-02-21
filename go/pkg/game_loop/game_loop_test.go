package gameloop_test

import (
	"testing"
	"time"

	gameloop "github.com/ThePrimeagen/tyrone-biggums/pkg/game_loop"
	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
)

func newGameLoop() (*gameloop.Game, [2]*Socket) {
    sockets := [2]*Socket{
        newSocket(),
        newSocket(),
    }

    gameLoop := gameloop.NewGame([2]server.Socket{
        sockets[0],
        sockets[1],
    })

    return gameLoop, sockets
}

func TestGameLoopReady(t *testing.T) {

    gameLoop, sockets := newGameLoop()

    waitForReadyDone := gameloop.WaitForReady(gameLoop.Players[0], gameLoop.Players[1])

    msg := <-sockets[0].outBound
    msg2 := <-sockets[1].outBound

    if msg.Message.Type != server.ReadyUp {
        t.Errorf("msg1 type isn't readyup %d %+v", server.ReadyUp, msg)
    }

    if msg2.Message.Type != server.ReadyUp {
        t.Errorf("msg2 type isn't readyup %d %+v", server.ReadyUp, msg2)
    }

    readyMessage := server.CreateMessage(server.ReadyUp)
    sockets[0].inBound <- readyMessage
    sockets[1].inBound <- readyMessage

    select {
    case <-waitForReadyDone:
    case <-time.After(1 * time.Second):
        t.Error("1 second elapsed without waitForReadyDone ")
    }
}

