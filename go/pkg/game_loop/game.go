package gameloop

import (
	"log"

	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
)

type Game struct {
	Players [2]*Player
	sockets [2]server.Socket
	bullets []*Bullet
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
		make([]*Bullet, 0),
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
		make([]*Bullet, 0),
		nil,
        clock,
	}
}

func (g *Game) updateBulletPositions(delta int64) {
    deltaF := float64(delta) / 1000.0

    for _, bullet := range g.bullets {
        bullet.Geo.X += deltaF * bullet.Vel[0]
        bullet.Geo.Y += deltaF * bullet.Vel[1]
    }
}

func (g *Game) checkBulletCollisions() {
    loop_me_daddy: for idx1 := 0; idx1 < len(g.bullets); {
        bullet := g.bullets[idx1]
        for idx2 := idx1 + 1; idx2 < len(g.bullets); idx2 += 1 {
            bullet2 := g.bullets[idx2]
            if bullet.Geo.HasCollision(&bullet2.Geo) {
                g.bullets = append(g.bullets[:idx2], g.bullets[(idx2 + 1):]...)
                g.bullets = append(g.bullets[:idx1], g.bullets[(idx1 + 1):]...)
                break loop_me_daddy
            }
        }

        idx1 += 1
    }
}

func (g *Game) updateStateFromMessageQueue() {
	messages := g.queue.Flush()
	for _, message := range messages {
		if message.Message.Type == server.Fire {
			player := g.Players[message.From-1]
            fired := player.Fire()

			if fired {
				bullet := CreateBulletFromPlayer(player, 1.0)
				g.bullets = append(g.bullets, &bullet)
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

    lastLoop := g.clock.Now().UnixMicro()

    for {
        // TODO:
        // 3b.  check for player bullet collisions..
        // 4.   see if a player has been hit by bullet
        // 4b.  if player has, finish the loop, report result, call it a day
        // 5.   sleep for up to 16.66ms

        now := g.clock.Now().UnixMicro()
        diff := now - lastLoop

        // 1.  check the message queue
        g.updateStateFromMessageQueue()

        // 2. update all the bullets
        g.updateBulletPositions(diff)

        // 3.  check for collisions
        g.checkBulletCollisions()
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
