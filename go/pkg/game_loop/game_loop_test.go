package gameloop

import (
	"testing"
	"time"

	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
	"github.com/gorilla/websocket"
)


type Socket struct {
    outBound chan *server.Message
    inBound chan *server.Message
}

func (s *Socket) GetOutBound() chan<- *server.Message {
    return s.outBound
}

func (s *Socket) GetInBound() <-chan *server.Message {
    return s.inBound
}

func (s *Socket) Close() error {
    return nil;
}

func newSocket() *Socket {
    return &Socket{
        make(chan *server.Message),
        make(chan *server.Message),
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
    waitForReadyDone := gameLoop.waitForReady()

    msg := <-sockets[0].outBound
    msg2 := <-sockets[1].outBound

    if msg.Message.Type != server.ReadyUp {
        t.Errorf("msg1 type isn't readyup %d %+v", server.ReadyUp, msg)
    }

    if msg2.Message.Type != server.ReadyUp {
        t.Errorf("msg2 type isn't readyup %d %+v", server.ReadyUp, msg2)
    }

    sockets[0].inBound <- &server.Message {
        Type: websocket.TextMessage,
        Message: server.GameMessage {
            Type: 69,
        },
    }

    sockets[1].inBound <- &server.Message {
        Type: websocket.TextMessage,
        Message: server.GameMessage {
            Type: 69,
        },
    }

    select {
    case <-waitForReadyDone:
    case <-time.After(1 * time.Second):
        t.Error("1 second elapsed without waitForReadyDone ")
    }
}

