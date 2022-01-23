package server

import "github.com/gorilla/websocket"

type Message struct {
    Type uint
    Id uint
    Message string
}


func (m *Message) FromMessage(message string) *Message {
    return &Message {
        websocket.TextMessage,
        m.Id,
        message,
    }
}

func NewMessage(id uint, message string) *Message {
    return &Message {
        Type: websocket.TextMessage,
        Id: id,
        Message: message,
    }
}

func CloseMessage(id uint) *Message {
    return &Message {
        websocket.CloseMessage,
        id,
        "",
    }
}

