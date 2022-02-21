package gameloop

import "github.com/ThePrimeagen/tyrone-biggums/pkg/server"

type GameQueue struct {
    messages []server.MessageEnvelope
    killChan chan struct{}
}

func NewQueue() GameQueue {
    return GameQueue {
        messages: make([]server.MessageEnvelope, 5),
        killChan: make(chan struct{}),
    };
}

// TODO: Learn about context
func (q *GameQueue) Start(s0, s1 server.Socket) {
    go func() {
        for {
            select {
            case msg := <- s0.GetInBound():
                q.messages = append(q.messages, msg)
            case msg := <- s1.GetInBound():
                q.messages = append(q.messages, msg)
            case <- q.killChan:
                break;
            }
        }
    }()
}

func (q *GameQueue) Stop() {
    q.killChan <- struct{}{}
}

func (q *GameQueue) Flush() []server.MessageEnvelope {
    if len(q.messages) == 0 {
        return nil
    }

    messages := q.messages
    q.messages = make([]server.MessageEnvelope, 5)

    return messages
}

