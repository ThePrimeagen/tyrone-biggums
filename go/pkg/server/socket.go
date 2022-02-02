package server

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

type Socket struct {
    OutBound chan<- *Message
    InBound <-chan *Message
    conn *websocket.Conn
}

func (s *Socket) Close() error {
    return s.conn.Close()
}

func NewSocket(w http.ResponseWriter, r *http.Request) (*Socket, error) {
	c, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        return nil, err;
    }

    // from me to network
    out := make(chan *Message)

    // from network to me
    in := make(chan *Message) // other type

    go func() {
        defer func() {
            in <- CloseMessage()
            c.Close()
        }()

        for {
            mt, message, err := c.ReadMessage()
            if err != nil {
                log.Println("read:", err)
                break
            }

            if mt != websocket.TextMessage {
                continue
            }

            in <- NewMessage(string(message))
        }
    }()

    go func() {
        for msg := range out {
            c.WriteMessage(websocket.TextMessage, []byte(msg.Message))
        }
    }()

    return &Socket{
        out,
        in,
        c,
    }, nil
}

