package server

import (
	"encoding/json"

	"github.com/gorilla/websocket"
)

type Message struct {
	Type    int
	Message GameMessage
}

const (
	ReadyUp int = iota
)

type GameMessage struct {
	Type int `json:"type"`
}

func FromSocket(msg []byte) Message {
	var gameMessage GameMessage
	json.Unmarshal(msg, &gameMessage)
	return Message{
		Type:    websocket.TextMessage,
		Message: gameMessage,
	}
}

func ReadyUpMessage() Message {
	return Message{
		Type:    websocket.TextMessage,
		Message: GameMessage{ReadyUp},
	}
}
