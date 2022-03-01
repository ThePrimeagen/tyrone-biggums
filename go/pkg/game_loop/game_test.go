package gameloop_test

import (
	"testing"
	"time"

	gameloop "github.com/ThePrimeagen/tyrone-biggums/pkg/game_loop"
	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
)

func TestWaitForReady(t *testing.T) {

    _, sockets, _ := NewGameComponents()

    waitForReadyDone := gameloop.WaitForReady(sockets[0], sockets[1])

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

