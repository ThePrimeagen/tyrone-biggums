package gameloop

import (
	"testing"
	"time"

	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
	"github.com/gorilla/websocket"
)

// TestSocket is like a server socket but with no rules about sending or receiving for the outbox and inbox channels
type TestSocket struct {
	Inbox, Outbox chan server.Message
}

func newGameLoop() (*GameLoop, [2]TestSocket) {
	sockets := [2]TestSocket{
		{
			Outbox: make(chan server.Message),
			Inbox:  make(chan server.Message),
		},
		{
			Outbox: make(chan server.Message),
			Inbox:  make(chan server.Message),
		},
	}

	gameLoop := NewGameLoop([2]*server.Socket{
		{
			Outbox: sockets[0].Outbox,
			Inbox:  sockets[0].Inbox,
		},
		{
			Outbox: sockets[1].Outbox,
			Inbox:  sockets[1].Inbox,
		},
	})

	return gameLoop, sockets
}

func TestGameLoopReady(t *testing.T) {
	gameLoop, sockets := newGameLoop()
	waitForReadyDone := gameLoop.waitForReady()

	msg := <-sockets[0].Outbox
	msg2 := <-sockets[1].Outbox

	if msg.Message.Type != server.ReadyUp {
		t.Errorf("msg1 type isn't readyup %d %+v", server.ReadyUp, msg)
	}

	if msg2.Message.Type != server.ReadyUp {
		t.Errorf("msg2 type isn't readyup %d %+v", server.ReadyUp, msg2)
	}

	sockets[0].Inbox <- server.Message{
		Type: websocket.TextMessage,
		Message: server.GameMessage{
			Type: 69,
		},
	}

	sockets[1].Inbox <- server.Message{
		Type: websocket.TextMessage,
		Message: server.GameMessage{
			Type: 69,
		},
	}

	select {
	case <-waitForReadyDone:
	case <-time.After(1 * time.Second):
		t.Error("1 second elapsed without waitForReadyDone ")
	}
}
