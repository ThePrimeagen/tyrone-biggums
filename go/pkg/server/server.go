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

	In          chan *Message
	Out         chan *Message
	from_socket chan *Message
}

var upgrader = websocket.Upgrader{} // use default options

func NewServer() (*Server, error) {
	out := make(chan *Message)
	from_socket := make(chan *Message)
	server := Server{
		currentId:   0,
		sockets:     make(map[uint]*Socket),
		In:          make(chan *Message),
		from_socket: from_socket,
		Out:         out,
		lock:        sync.Mutex{},
	}

	go func() {
		for {
			select {
			case msg := <-out:
				server.lock.Lock()
				server.sockets[msg.Id].Out <- msg
				server.lock.Unlock()

			case msg := <-from_socket:
				if msg.Type == websocket.CloseMessage {
					server.lock.Lock()
					delete(server.sockets, msg.Id)
					server.lock.Unlock()
				}
				server.In <- msg
			}
		}
	}()

	return &server, nil
}

func (s *Server) HandleNewConnection(w http.ResponseWriter, r *http.Request) {

	id := s.currentId
	s.currentId += 1

	socket, err := NewSocket(id, s.from_socket, w, r)

	s.lock.Lock()
	s.sockets[id] = socket
	s.lock.Unlock()

	if err != nil {
		log.Print("couldn't upgrade socket.", err)
		return
	}
}
