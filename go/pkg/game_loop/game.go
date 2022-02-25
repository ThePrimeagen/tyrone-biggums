package gameloop

import (
	"log"

	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
)

type Game struct {
	Players [2]server.Socket
    bullets []Bullet
    queue *GameQueue
}

func NewGame(players [2]server.Socket) *Game {
    return &Game{
        players,
        make([]Bullet, 0),
        nil,
    }
}

func doSomething(message *QueueMessage) {
}

func (g *Game) runGameLoop() {
    for {
        // 1.  Check the message queue.
        // 2.  update all bullet positions
        // 3.  check for collisions
        // 4.  see if a player has been hit by bullet
        // 4.a if player has, finish the loop, report result, call it a day
        // 5.  sleep for up to 16.66ms

        // 1.  check the message queue
        messages := g.queue.Flush()
        for _, message := range messages {
            doSomething(message)
        }

        // 2. update all the bullets
    }
}

// TODO: Bad naming here.  RENAME
// TODO: Make this into some sort of enum return.
func (g *Game) Run() WhenComplete {
    gameFinished := make(chan WaitForReadyResults);

    go func() {
        defer close(gameFinished)

        log.Println("Waiting for players to ready")
        res := <-WaitForReady(g.Players[0], g.Players[1])

        // TODO: I don't like this.
        if res.timedout || res.readyError {
            gameFinished <- res
            return
        }

        g.runGameLoop()
    }()

    return gameFinished;
}
