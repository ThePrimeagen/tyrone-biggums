package server

import (
	"encoding/json"
	"fmt"

	"github.com/ThePrimeagen/tyrone-biggums/pkg/stats"
	"github.com/gorilla/websocket"
)

type MessageEnvelope struct {
	Type    int
	Message GameMessage
}

const (
    ReadyUp int = iota
    Play
    Fire
    GameOver
)

type GameMessage struct {
    Type int `json:"type"`
    Msg string `json:"msg,omitempty"` // how to optionally specify?
}

func FromSocket(msg []byte) MessageEnvelope {
    var gameMessage GameMessage
    json.Unmarshal(msg, &gameMessage)
    return MessageEnvelope {
        Type: websocket.TextMessage,
        Message: gameMessage,
    }
}

func CreateMessage(messageType int) MessageEnvelope {
    return MessageEnvelope{
        Type: websocket.TextMessage,
        Message: GameMessage{
            messageType, "",
        },
    }
}

func CreateWinnerMessage(gameStats *stats.GameStats) MessageEnvelope {
    return MessageEnvelope{
        Type: websocket.TextMessage,
        Message: GameMessage{
            Type: GameOver,
            Msg: fmt.Sprintf("winner(%v)___%v", stats.ActiveGames, gameStats),
        },
    }
}

func CreateLoserMessage() MessageEnvelope {
    return MessageEnvelope{
        Type: websocket.TextMessage,
        Message: GameMessage{
            Type: GameOver,
            Msg: "loser",
        },
    }
}

func ErrorGameOver(msg string) MessageEnvelope {
    return MessageEnvelope{
        Type: websocket.TextMessage,
        Message: GameMessage{
            Type: GameOver,
            Msg: msg,
        },
    }
}
