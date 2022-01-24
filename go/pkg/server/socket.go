package server

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

type Socket struct {
    id uint
    Out chan<- *Message
}

func NewSocket(id uint, in chan *Message, w http.ResponseWriter, r *http.Request) (*Socket, error) {
	c, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        return nil, err;
    }

    // from me to network
    out := make(chan *Message)

    go func() {
        defer func() {
            in <- CloseMessage(id)

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

            in <- NewMessage(id, string(message))
        }
    }()

    go func() {
        for msg := range out {
            c.WriteMessage(websocket.TextMessage, []byte(msg.Message))
        }
    }()

    return &Socket{
        id,
        out,
    }, nil
}

