package gameloop

import (
	"time"

	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
	"github.com/ThePrimeagen/tyrone-biggums/pkg/stats"
)

type Game struct {
	Players [2]*Player
	sockets [2]server.Socket
	bullets []*Bullet
	queue   *GameQueue
	clock   IGameClock
	stats   *stats.GameStats
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
        stats.NewGameStat(),
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
        stats.NewGameStat(),
	}
}

func (g *Game) updateBulletPositions(delta int64) {
    deltaF := float64(delta) / 1000.0

    for _, bullet := range g.bullets {
        bullet.Geo.X += deltaF * bullet.Vel[0]
        bullet.Geo.Y += deltaF * bullet.Vel[1]
    }
}

func (g *Game) checkForBulletPlayerCollisions() (*Player) { // Note: Java for the bois
    // this is obvi not made fast.  Lets just get it done.
    var outPlayer *Player

    loopMeDaddy: for _, player := range g.Players {

        for bIdx := 0; bIdx < len(g.bullets); bIdx += 1 {

            bullet := g.bullets[bIdx]
            if bullet.Geo.HasCollision(&player.Geo) {
                outPlayer = player
                break loopMeDaddy
            }
        }
    }

    return outPlayer
}

func (g *Game) checkBulletCollisions() {
    loop_me_daddy: for idx1 := 0; idx1 < len(g.bullets); {
        bullet := g.bullets[idx1]
        for idx2 := idx1 + 1; idx2 < len(g.bullets); idx2 += 1 {
            bullet2 := g.bullets[idx2]
            if bullet.Geo.HasCollision(&bullet2.Geo) {
                // that is also very crappy code.  Why would I ever do this...
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

func (g *Game) getSocket(player *Player) server.Socket {
    if player == g.Players[0] {
        return g.sockets[0]
    }
    return g.sockets[1]
}

func (g *Game) getOtherPlayer(player *Player) *Player {
    if player == g.Players[0] {
        return g.Players[1]
    }
    return g.Players[0]
}

func (g *Game) runGameLoop() {

    lastLoop := g.clock.Now().UnixMicro()
    var loser *Player;

    stats.AddActiveGame()
    defer stats.RemoveActiveGame()

    g.sockets[0].GetOutBound() <- server.CreateMessage(server.Play)
    g.sockets[1].GetOutBound() <- server.CreateMessage(server.Play)

    for {
        start := g.clock.Now().UnixMicro()
        diff := start - lastLoop
        g.stats.AddDelta(diff)

        // 1.  check the message queue
        g.updateStateFromMessageQueue()

        // 2. update all the bullets
        g.updateBulletPositions(diff)

        // 3.  check for collisions
        g.checkBulletCollisions()

        // 3b.  check for player bullet collisions..
        loser = g.checkForBulletPlayerCollisions()
        if loser != nil {
            // 4.  Stop the loop if game is over
            break
        }

        // 5.   sleep for up to 16.66ms
        now := g.clock.Now().UnixMicro()
        time.Sleep(time.Duration(16_000 - (now - start)) * time.Microsecond)

        lastLoop = start
    }


    // 4b.  Tell each player that they have won/lost.
    // 4b.  Close down the sockets and call it a day
    winnerMsg := server.CreateWinnerMessage(g.stats)
    loserMsg := server.CreateLoserMessage()
    winner := g.getOtherPlayer(loser)

    winnerSock := g.getSocket(winner)
    loserSock := g.getSocket(loser)

    winnerSock.GetOutBound() <- winnerMsg
    loserSock.GetOutBound() <- loserMsg

    winnerSock.Close()
    loserSock.Close()
}

// TODO: Bad naming here.  RENAME
// TODO: Make this into some sort of enum return.
func (g *Game) Run() WhenComplete {
	gameFinished := make(chan WaitForReadyResults)

	go func() {
		defer close(gameFinished)

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
