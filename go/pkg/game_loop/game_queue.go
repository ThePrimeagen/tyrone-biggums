package gameloop

import (
	"sync"

	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
)

type GameQueue struct {
	messages []*server.MessageEnvelope
	killChan chan struct{}
	mutex    sync.Mutex
}

func NewQueue() GameQueue {
	return GameQueue{
		messages: make([]*server.MessageEnvelope, 0),
		killChan: make(chan struct{}),
		mutex:    sync.Mutex{},
	}
}

// TODO: Learn about context
func (q *GameQueue) Start(s0, s1 server.Socket) {
	go func() {
	label_for_you:
		for {
			select {
			case msg := <-s0.GetInBound():
				q.mutex.Lock()
				q.messages = append(q.messages, &msg)
				q.mutex.Unlock()
			case msg := <-s1.GetInBound():
				q.mutex.Lock()
				q.messages = append(q.messages, &msg)
				q.mutex.Unlock()
			case <-q.killChan:
				break label_for_you
			}
		}
	}()
}

func (q *GameQueue) Stop() {
	q.killChan <- struct{}{}
}

func (q *GameQueue) emptyMessages() bool {
    out := true
    for _, msg := range q.messages {
        out = out && msg == nil
        if !out {
            break
        }
    }

    return out
}

func (q *GameQueue) Flush() []*server.MessageEnvelope {
	q.mutex.Lock()
	defer q.mutex.Unlock()

    if q.emptyMessages() {
        return nil
    }

	messages := q.messages
	q.messages = make([]*server.MessageEnvelope, 0)

	return messages
}
