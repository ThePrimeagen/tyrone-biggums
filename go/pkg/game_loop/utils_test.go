package gameloop_test

import (
    "github.com/ThePrimeagen/tyrone-biggums/pkg/server"
	gameloop "github.com/ThePrimeagen/tyrone-biggums/pkg/game_loop"
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
