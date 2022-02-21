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

func (g *Game) Run() WhenComplete {
    gameFinished := make(chan struct{});

    go func() {
        log.Println("Waiting for players to ready")
        _, ok := <-WaitForReady(g.Players[0], g.Players[1])

        if ok {
            log.Println("there was an error waiting for ready...")
            g.Players[0].Close()
            g.Players[1].Close()
        }

        log.Println("Players are ready!")

        close(gameFinished)
    }()

    return gameFinished;
}
