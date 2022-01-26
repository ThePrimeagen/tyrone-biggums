package chat

import (
	"encoding/json"
	"log"
	"strings"
	"sync"

	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
	"github.com/gorilla/websocket"
)

// import _ "net/http/pprof" then
// log.Println(http.ListenAndServe("localhost:6969", nil)), it will start a
// fully functioning debug web server for cpu/mem etc

// http://localhost:6969/debug/pprof/mutex for mutex debugging

type User struct {
	sent uint
	recv uint
}

type Chat struct {
	out             chan<- []*server.Message
    users           map[uint]User
	channels        map[string]map[uint]struct{}
	lookup_channels map[uint]string
	mu              sync.Mutex
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

    msgs := []*server.Message{
        server.NewMessage(id, fmt.Sprintf("!join successful: %d", id)),
    }
    c.out <- msgs
}

func (c *Chat) processMessage(message *server.Message) {
	c.mu.Lock()
	defer c.mu.Unlock()

    msgs := []*server.Message{}
    c.out <- msgs
	if val, ok := c.lookup_channels[message.Id]; ok {
        if user, ok := c.users[message.Id]; ok {
            user.recv += 1
        }
		var content server.MessageContent
		err := json.Unmarshal([]byte(message.Message), &content)
		if err != nil {
			fmt.Println("error:", err)
		}

		content.Inc += 1

		channel := c.channels[val]
		channel_message, err := json.Marshal(server.ChatMessage{
			Channel_name:       val,
			Channel_user_count: len(channel),
			From:               message.Id,
			Msg:                content,
		})

		if err != nil {
			log.Fatalf("%+v\n", err)
		}

		channel_message_string := string(channel_message)

		for socketId := range channel {
            if user, ok := c.users[socketId]; ok {
                user.recv += 1
            }
			msgs = append(msgs, server.NewMessage(socketId, channel_message_string))
		}

	} else {
        msgs = append(msgs, message.FromMessage("You haven't joined a channel yet.  Please execute !join <channel name> before sending messages"))
	}
    log.Printf("sending %+v messages", len(msgs))
    c.out <- msgs
}

func StartChat(in <-chan *server.Message, out chan<- []*server.Message) *Chat {

	chat := Chat{
		out,
		map[uint]User{},
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
