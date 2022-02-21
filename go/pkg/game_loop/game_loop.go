package gameloop

import (
	"log"

	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
)

type GameLoop struct {
	Players [2]server.Socket
}

func NewGameLoop(players [2]server.Socket) *GameLoop {
    return &GameLoop{
        players,
    }
}

func (gl *GameLoop) Run() WhenComplete {
    game_finished := make(chan struct{});

    go func() {
        log.Println("Waiting for players to ready")
        _, has_closed := <-WaitForReady(gl.Players[0], gl.Players[1])

        if !has_closed {
            log.Println("there was an error waiting for ready...")
            gl.Players[0].Close()
            gl.Players[1].Close()
        }

        log.Println("Players are ready!")

        close(game_finished)
    }()

    return game_finished;
}
