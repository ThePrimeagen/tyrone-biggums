package gameloop

import (
	"log"

	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
)

type GameLoop struct {
	players [2]server.Socket
    playersReady [2]bool
}

func NewGameLoop(players [2]server.Socket) *GameLoop {
    return &GameLoop{
        players,
        [2]bool{ false, false },
    }
}

type WhenComplete = <-chan struct{};

func (gl *GameLoop) waitForReady() WhenComplete {
    ready := make(chan struct{});

    go func() {
        gl.players[0].GetOutBound() <- server.CreateMessage(server.ReadyUp)
        gl.players[1].GetOutBound() <- server.CreateMessage(server.ReadyUp)

        in1 := gl.players[0].GetInBound()
        in2 := gl.players[1].GetInBound()
        count := 0

        for {
            select {
            case msg, err := <-in1:
                if err {
                    ready <- struct{}{} // much gross
                    break
                }

                if msg.Message.Type == server.ReadyUp {
                    count += 1
                    in1 = nil
                }

            case msg, err := <-in2:
                if err {
                    ready <- struct{}{}
                    break
                }

                if msg.Message.Type == server.ReadyUp {
                    count += 1
                    in2 = nil
                }
            }

            if count == 2 {
                break;
            }
        }
        close(ready)
    }()

    return ready;
}

func (gl *GameLoop) Run() WhenComplete {
    game_finished := make(chan struct{});

    go func() {
        log.Println("Waiting for players to ready")
        _, has_closed := <-gl.waitForReady()

        if !has_closed {
            log.Println("there was an error waiting for ready...")
            gl.players[0].Close()
            gl.players[1].Close()
        }

        log.Println("Players are ready!")

        close(game_finished)
    }()

    return game_finished;
}
