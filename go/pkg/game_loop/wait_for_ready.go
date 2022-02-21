package gameloop

import (
	"time"

	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
)

type WaitForReadyResults struct {
    readyError, timedout bool
}

type WhenComplete = <-chan WaitForReadyResults

func sendAndWait(s1 server.Socket, s2 server.Socket) chan bool {
    ready := make(chan bool);

    go func() {
        s1.GetOutBound() <- server.CreateMessage(server.ReadyUp)
        s2.GetOutBound() <- server.CreateMessage(server.ReadyUp)

        in1 := s1.GetInBound()
        in2 := s2.GetInBound()
        count := 0
        success := true

        for {
            select {
            case msg, ok := <-in1:
                if !ok {
                    success = false
                    break
                }

                if msg.Message.Type == server.ReadyUp {
                    count += 1
                    in1 = nil
                }

            case msg, ok := <-in2:
                if !ok {
                    success = false
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

        ready <- success
        close(ready)
    }()

    return ready;
}

func WaitForReady(s0 server.Socket, s1 server.Socket) WhenComplete {
    ready := make(chan WaitForReadyResults);

    go func() {
        select {
        case _, ok := <-sendAndWait(s0, s1):
            ready <- WaitForReadyResults {ok, false}
        case <-time.After(30 * time.Second):
            ready <- WaitForReadyResults {false, true}
        }
    }()

    return ready
}


