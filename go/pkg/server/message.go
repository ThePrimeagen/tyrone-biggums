package server

import "github.com/gorilla/websocket"

type MessageContent struct {
	Msg string  `json:"msg"`
	Ts  float64 `json:"ts"`
	Inc uint    `json:"inc"`
}

type Message struct {
	Type    uint
	Message string
}

type ChatMessage struct {
	Channel_name       string         `json:"channel_name"`
	Channel_user_count int            `json:"channel_user_count"`
	From               uint           `json:"from"`
	Msg                MessageContent `json:"msg"`
}

func (m *Message) FromMessage(message string) *Message {
	return &Message{
		websocket.TextMessage,
		message,
	}
}

func NewMessage(message string) *Message {
	return &Message{
		Type:    websocket.TextMessage,
		Message: message,
	}
}

func CloseMessage() *Message {
	return &Message{
		websocket.CloseMessage,
		"",
	}
}
