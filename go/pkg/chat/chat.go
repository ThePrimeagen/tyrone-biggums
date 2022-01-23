package chat

import (
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

func (c *Chat) leaveChannel(id uint) *Chat {
	c.mu.Lock()
	defer c.mu.Unlock()

    channel := c.lookup_channels[id]
    delete(c.channels[channel], id)
    delete(c.lookup_channels, id)

	return c
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
}

func (c *Chat) processMessage(message *server.Message) {
	c.mu.Lock()
	defer c.mu.Unlock()

    if val, ok := c.lookup_channels[message.Id]; ok {
        for socketId := range c.channels[val] {
            c.out <- server.NewMessage(socketId, message.Message)
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
            } else if msg.Type != websocket.TextMessage {
                continue
            }

			if strings.HasPrefix(msg.Message, "!join ") {
				parts := strings.Split(msg.Message, " ")
				chat.
					leaveChannel(msg.Id).
					joinChannel(msg.Id, parts[1])

			} else if msg.Message == ":q" {
				chat.leaveChannel(msg.Id)
			} else {
				chat.processMessage(msg)
			}
		}
	}()

    return &chat
}
