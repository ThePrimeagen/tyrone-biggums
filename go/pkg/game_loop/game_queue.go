package gameloop

import (
	"github.com/ThePrimeagen/tyrone-biggums/pkg/memqueue"
	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
)

type QueueMessage struct {
	From    uint
	Message server.GameMessage
}

type GameQueue struct {
	messages *memqueue.MemQueue[*QueueMessage]
	s0       server.Socket
	s1       server.Socket
	killChan chan struct{}
}

func NewQueue(s0, s1 server.Socket) *GameQueue {
	q := memqueue.NewMemQueue[*QueueMessage]()
	return &GameQueue{
		messages: q,
		killChan: make(chan struct{}),
		s0:       s0,
		s1:       s1,
	}
}

// TODO: Learn about context
func (q *GameQueue) Start() {
	go func() {
	label_for_you:
		for {
			select {
			case msg := <-q.s0.GetInBound():
				q.messages.Enqueue(&QueueMessage{
					1,
					msg.Message,
				})
			case msg := <-q.s1.GetInBound():
				q.messages.Enqueue(&QueueMessage{
					2,
					msg.Message,
				})
			case <-q.killChan:
				break label_for_you
			}
		}
	}()
}

func (q *GameQueue) Stop() {
	q.killChan <- struct{}{}
}

func (q *GameQueue) Flush() []*QueueMessage {

	q.Stop()
	tempQ := q.messages
	q.messages = memqueue.NewMemQueue[*QueueMessage]()
	q.Start()

	messages := []*QueueMessage{}
	for {
		msg, ok := tempQ.Dequeue()
		if !ok {
			break
		}
		messages = append(messages, msg)
	}
	if len(messages) == 0 {
		return nil
	}

	return messages
}
