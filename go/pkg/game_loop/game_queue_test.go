package gameloop_test

import (
	"testing"
	"time"

	gameloop "github.com/ThePrimeagen/tyrone-biggums/pkg/game_loop"
	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
)

func testMessage(t *testing.T, queue *gameloop.GameQueue, froms []uint) {

	messages := queue.Flush()

	if len(messages) != len(froms) {
		t.Errorf("Expected to have %v messages, but got %v messages", len(froms), len(messages))
	}

	for i, message := range messages {
		if message.From != froms[i] {
			t.Errorf("Expected a message From 1 but got %v", message.From)
		}
	}

	messages = queue.Flush()
	if messages != nil {
		t.Errorf("Expecting the queue to be empty but got %v messages", len(messages))
	}
}

func TestGameQueue(t *testing.T) {
	queue := gameloop.NewQueue()
	s1 := newSocket()
	s2 := newSocket()

	queue.Start(s1, s2)

	msgs := queue.Flush()
	if msgs != nil {
		t.Errorf("Expected to have no messages when flushed %+v", msgs)
	}

	// TODO: What are good ways to ensure that this runs properly?
	// What i don't want to do is add stuff to the queue
	//
	// Perhaps (probably not if we are real here) I could make the socket have
	// some sort of fan out where I can listen to make sure that the channel
	// has been sent the message before proceeding instead of using 1 ms
	// timeout.
	s1.inBound <- server.CreateMessage(server.Fire)
	time.Sleep(time.Millisecond)
	testMessage(t, queue, []uint{1})

	s2.inBound <- server.CreateMessage(server.Fire)
	time.Sleep(time.Millisecond)
	testMessage(t, queue, []uint{2})

	s2.inBound <- server.CreateMessage(server.Fire)
	s1.inBound <- server.CreateMessage(server.Fire)
	time.Sleep(time.Millisecond)
	testMessage(t, queue, []uint{2, 1})
}
