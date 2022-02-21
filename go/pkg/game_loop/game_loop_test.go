package gameloop

import (
	"testing"
	"time"

	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
)


type Socket struct {
    outBound chan server.MessageEnvelope
    inBound chan server.MessageEnvelope
}

func (s *Socket) GetOutBound() chan<- server.MessageEnvelope {
    return s.outBound
}

func (s *Socket) GetInBound() <-chan server.MessageEnvelope {
    return s.inBound
}

func (s *Socket) Close() error {
    return nil;
}

func newSocket() *Socket {
    return &Socket{
        make(chan server.MessageEnvelope),
        make(chan server.MessageEnvelope),
    }
}

func newGameLoop() (*GameLoop, [2]*Socket) {
    sockets := [2]*Socket{
        newSocket(),
        newSocket(),
    }

    gameLoop := NewGameLoop([2]server.Socket{
        sockets[0],
        sockets[1],
    })

    return gameLoop, sockets
}

func TestGameLoopReady(t *testing.T) {

    gameLoop, sockets := newGameLoop()
    waitForReadyDone := WaitForReady(gameLoop.Players[0], gameLoop.Players[1])

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

