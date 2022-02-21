package gameloop

import (
	"log"
	"time"

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
        defer close(gameFinished)

        log.Println("Waiting for players to ready")

        log.Println("Players are ready!")
    }()

    return gameFinished;
}
