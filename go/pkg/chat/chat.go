package chat

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"

	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
	"github.com/gorilla/websocket"
)

type Chat struct {
	out      chan<- *server.Message
	channels map[string]map[uint]struct{}
    lookup_channels map[uint]string
	mu       sync.Mutex
}

func (c *Chat) leaveChannel(id uint) {
	c.mu.Lock()
    defer c.mu.Unlock()

    if val, ok := c.lookup_channels[id]; ok {
        delete(c.channels[val], id)
        delete(c.lookup_channels, id)
    }

}

func (c *Chat) joinChannel(id uint, channel string) {
	c.mu.Lock()
    defer c.mu.Unlock()

	found_channel := c.channels[channel]
	if found_channel == nil {
		found_channel = map[uint]struct{}{}
        c.channels[channel] = found_channel
	}

    found_channel[id] = struct{}{}
    c.lookup_channels[id] = channel
    c.out <- server.NewMessage(id, fmt.Sprintf("!join successful: %d", id));
}

func (c *Chat) processMessage(message *server.Message) {
	c.mu.Lock()
    defer c.mu.Unlock()

    if val, ok := c.lookup_channels[message.Id]; ok {
        channel := c.channels[val]
        channel_message, err := json.Marshal(server.ChatMessage {
            Channel_name: val,
            Channel_user_count: len(channel),
            From: message.Id,
            Msg: message.Message,
        })

        if err != nil {
            log.Fatalf("%+v\n", err)
        }

        channel_message_string := string(channel_message)

        for socketId := range channel {
            c.out <- server.NewMessage(socketId, channel_message_string)
        }

    } else {
        c.out <- message.FromMessage("You haven't joined a channel yet.  Please execute !join <channel name> before sending messages")
    }
}

func StartChat(in <-chan *server.Message, out chan<- *server.Message) *Chat {

	chat := Chat{
		out,
		map[string]map[uint]struct{}{},
        map[uint]string{},
		sync.Mutex{},
	}

	go func() {
        for msg := range in {
            if msg.Type == websocket.CloseMessage {
				chat.leaveChannel(msg.Id)
                continue
            } else if msg.Type != websocket.TextMessage {
                continue
            }

			if strings.HasPrefix(msg.Message, "!join ") {
				parts := strings.Split(msg.Message, " ")
				chat.leaveChannel(msg.Id)
				chat.joinChannel(msg.Id, parts[1])

			} else if msg.Message == ":q" {
				chat.leaveChannel(msg.Id)
			} else {
				chat.processMessage(msg)
			}
		}
	}()

    return &chat
}
