package gameloop

import (
	"log"

	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
)

type Game struct {
	Players [2]*Player
	sockets [2]server.Socket
	bullets []Bullet
	queue   *GameQueue
	clock   IGameClock
}

func NewGame(sockets [2]server.Socket) *Game {
	return &Game{
		// TODO: finish this thing right
		[2]*Player{
			NewPlayer(Vector2D {2500, 0}, Vector2D {-1, 0}, 180),
			NewPlayer(Vector2D {-2500, 0}, Vector2D {1, 0}, 300), // THE LOSER
		},
		sockets,
		make([]Bullet, 0),
		nil,
        &GameClock{},
	}
}

func NewGameWithClock(sockets [2]server.Socket, clock IGameClock) *Game {
	return &Game{
		// TODO: finish this thing right
		[2]*Player{
			NewPlayerWithClock(Vector2D {2500, 0}, Vector2D {-1, 0}, 180, clock),
			NewPlayerWithClock(Vector2D {-2500, 0}, Vector2D {1, 0}, 300, clock), // THE LOSER
		},
		sockets,
		make([]Bullet, 0),
		nil,
        clock,
	}
}

// NOTE: How to avoid making this public and still have the helpers / internals
// from gameloop_test
func (g *Game) updateStateFromMessageQueue() {
	messages := g.queue.Flush()
	for _, message := range messages {
		if message.Message.Type == server.Fire {
			player := g.Players[message.From-1]
            fired := player.Fire()

			if fired {
				bullet := CreateBulletFromPlayer(player, 1.0)
				g.bullets = append(g.bullets, bullet)
			}
		}
	}
}

func (g *Game) startGame() {
    g.queue = NewQueue()

    // unique..
    g.queue.Start(g.sockets[0], g.sockets[1])
}

func (g *Game) runGameLoop() {

    for {
        // TODO:
        // 2.  update all bullet positions
        // 3.  check for collisions
        // 4.  see if a player has been hit by bullet
        // 4.a if player has, finish the loop, report result, call it a day
        // 5.  sleep for up to 16.66ms

        // 1.  check the message queue
        g.updateStateFromMessageQueue()

        // 2. update all the bullets
    }
}

// TODO: Bad naming here.  RENAME
// TODO: Make this into some sort of enum return.
func (g *Game) Run() WhenComplete {
	gameFinished := make(chan WaitForReadyResults)

	go func() {
		defer close(gameFinished)

		log.Println("Waiting for players to ready")
		res := <-WaitForReady(g.sockets[0], g.sockets[1])

		// TODO: I don't like this.
		if res.timedout || res.readyError {
			gameFinished <- res
			return
		}

        g.startGame()
		g.runGameLoop()
	}()

	return gameFinished
}
