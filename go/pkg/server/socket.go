package server

import (
	"log"
	"net/http"
)

type Socket struct {
    id uint
}

func NewSocket(id uint, w http.ResponseWriter, r *http.Request) (*Socket, error) {
	c, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        return nil, err;
    }

    go func() {
        defer c.Close()
        for {
            mt, message, err := c.ReadMessage()
            if err != nil {
                log.Println("read:", err)
                break
            }
            log.Printf("recv: %s", message)
            err = c.WriteMessage(mt, message)
            if err != nil {
                log.Println("write:", err)
                break
            }
        }
    }()

    return &Socket{
        id,
    }, nil
}


