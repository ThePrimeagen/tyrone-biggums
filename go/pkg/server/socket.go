package server

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

type Socket struct {
	Outbox chan<- Message
	Inbox  <-chan Message
}

func NewSocket(w http.ResponseWriter, r *http.Request) (*Socket, error) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return nil, err
	}

	// from me to network
	outbox := make(chan Message)

	// from network to me
	inbox := make(chan Message) // other type

	go func() {
		defer func() {
			// TODO: Do we need to create a close message?
			// in <- CloseMessage()
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

			inbox <- FromSocket(message)
		}
	}()

	go func() {
		for msg := range outbox {
			msg, err := json.Marshal(msg.Message)
			if err != nil {
				log.Fatalf("%+v\n", err)
			}

			c.WriteMessage(websocket.TextMessage, msg)
		}
	}()

	return &Socket{Outbox: outbox, Inbox: inbox}, nil
}
