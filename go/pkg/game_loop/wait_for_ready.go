package gameloop

import (
	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
)

type WhenComplete = <-chan struct{};

func WaitForReady(s1 server.Socket, s2 server.Socket) WhenComplete {
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


