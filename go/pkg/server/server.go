package server

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

type Server struct {
	sockets   map[uint]*Socket
	currentId uint
	lock      sync.Mutex
	In        chan *Message
	Out       chan *Message
}

var upgrader = websocket.Upgrader{} // use default options

func NewServer() (*Server, error) {
	return &Server{
		currentId: 0,
		sockets:   make(map[uint]*Socket),
		In:        make(chan *Message),
		Out:       make(chan *Message),
		lock:      sync.Mutex{},
	}, nil
}

func (s *Server) HandleNewConnection(w http.ResponseWriter, r *http.Request) {

	id := s.currentId
	s.currentId += 1

    socket_channel := make(chan *Message)
	socket, err := NewSocket(id, socket_channel, w, r)

    s.lock.Lock()
	s.sockets[id] = socket
    s.lock.Unlock()

	go func() {
		for msg := range s.Out {
            s.lock.Lock()
			s.sockets[msg.Id].Out <- msg
            s.lock.Unlock()
		}
	}()

	go func() {
		for msg := range socket_channel {
            if msg.Type == websocket.CloseMessage {
                s.lock.Lock()
                delete(s.sockets, msg.Id)
                s.lock.Unlock()
            }
            s.In <- msg
		}
	}()

	if err != nil {
		log.Print("couldn't upgrade socket.", err)
		return
	}
}
