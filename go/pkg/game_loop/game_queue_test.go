package gameloop_test

import (
	"testing"

	gameloop "github.com/ThePrimeagen/tyrone-biggums/pkg/game_loop"
	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
)

func TestGameQueue(t *testing.T) {
    queue := gameloop.NewQueue()
    s1 := newSocket()
    s2 := newSocket()

    queue.Start(s1, s2)

    msgs := queue.Flush()
    if msgs != nil {
        t.Errorf("Expected to have no messages when flushed %+v", msgs)
    }

    s1.inBound <- server.CreateMessage(server.Fire)

    msgs = queue.Flush()
    if msgs == nil {
        t.Errorf("Expected to have messages when flushed instead received nil")
    }

    if len(msgs) != 1 {
        t.Errorf("Expected to have only 1 message instead got %v", len(msgs))
    }
}
