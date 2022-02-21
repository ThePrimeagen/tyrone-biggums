package gameloop

import (
	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
)

type WhenComplete = <-chan struct{};

func sendAndWait(s1 server.Socket, s2 server.Socket) WhenComplete {
    ready := make(chan struct{});

    go func() {
        s1.GetOutBound() <- server.CreateMessage(server.ReadyUp)
        s2.GetOutBound() <- server.CreateMessage(server.ReadyUp)

        in1 := s1.GetInBound()
        in2 := s2.GetInBound()
        count := 0

        for {

            select {
            case msg, ok := <-in1:
                if !ok {
                    ready <- struct{}{} // much gross
                    break
                }

                if msg.Message.Type == server.ReadyUp {
                    count += 1
                    in1 = nil
                }

            case msg, ok := <-in2:
                if !ok {
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

func WaitForReady(s1 server.Socket, s2 server.Socket) WhenComplete {
    timedout := false
    select {
    case _, ok := <-WaitForReady(g.Players[0], g.Players[1]):
        // this means we received an error if the channel is still open...
        if ok {
            log.Println("there was an error waiting for ready...")
            g.Players[0].Close()
            g.Players[1].Close()
        }
    case <-time.After(30 * time.Second):
        timedout = true
    }

    if timedout {
        log.Println("We timedout waiting for readies... :(")
        g.Players[0].Close()
        g.Players[1].Close()
    }

}


