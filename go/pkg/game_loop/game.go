package gameloop

import (
	"log"

	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
)

type Game struct {
	Players [2]server.Socket
}

func NewGame(players [2]server.Socket) *Game {
    return &Game{
        players,
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

        log.Println("Players are ready!")
    }()

    return gameFinished;
}
