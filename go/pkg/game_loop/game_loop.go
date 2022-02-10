package gameloop

import (
	"log"

	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
)

type GameLoop struct {
	players      [2]*server.Socket
	playersReady [2]bool
}

func NewGameLoop(players [2]*server.Socket) *GameLoop {
	return &GameLoop{
		players,
		[2]bool{false, false},
	}
}

type WhenComplete = <-chan struct{}

func (gl *GameLoop) waitForReady() WhenComplete {
	ready := make(chan struct{})

	go func() {
		gl.players[0].Outbox <- server.ReadyUpMessage()
		gl.players[1].Outbox <- server.ReadyUpMessage()

		for {
			select {
			case <-gl.players[0].Inbox:
				// TODO: Get its id and verify its a ready command
				gl.playersReady[0] = true
			case <-gl.players[1].Inbox:

				// TODO: Get its id and verify its a ready command
				gl.playersReady[1] = true
			}
			if gl.playersReady[0] && gl.playersReady[1] {
				break
			}
		}
		close(ready)
	}()

	return ready
}

func (gl *GameLoop) Run() WhenComplete {
	game_finished := make(chan struct{})

	go func() {
		log.Println("Waiting for players to ready")
		<-gl.waitForReady()
		log.Println("Players are ready!")

		close(game_finished)
	}()

	return game_finished
}
