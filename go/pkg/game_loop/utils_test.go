package gameloop_test

import (
	"sync"

	gameloop "github.com/ThePrimeagen/tyrone-biggums/pkg/game_loop"
	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
)

type Socket struct {
	outBound chan server.MessageEnvelope
	inBound  chan server.MessageEnvelope
	closed   bool
	wg       *sync.WaitGroup
}

func (s *Socket) GetOutBound() chan<- server.MessageEnvelope {
	return s.outBound
}

func (s *Socket) GetInBound() <-chan server.MessageEnvelope {
	return s.inBound
}

func (s *Socket) Close() error {
	s.closed = true
	return nil
}

func (s *Socket) IsClosed() bool {
	return s.closed
}

func (s *Socket) WGOutbound() *sync.WaitGroup {
	return s.wg
}

func newSocket() *Socket {
	return &Socket{
		make(chan server.MessageEnvelope),
		make(chan server.MessageEnvelope),
		false,
		&sync.WaitGroup{},
	}
}

func NewGameComponents() (*gameloop.Game, [2]*Socket, *gameloop.SyntheticGameClock) {
	clock := gameloop.SyntheticGameClock{}

	sockets := [2]*Socket{
		newSocket(),
		newSocket(),
	}

	gameLoop := gameloop.NewGameWithClock([2]server.Socket{
		sockets[0],
		sockets[1],
	}, &clock)

	return gameLoop, sockets, &clock
}
