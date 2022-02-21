package gameloop_test

import "github.com/ThePrimeagen/tyrone-biggums/pkg/server"

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

