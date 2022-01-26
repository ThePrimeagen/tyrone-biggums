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
	Out         chan []*Message
	from_socket chan *Message
}

var upgrader = websocket.Upgrader{} // use default options

func NewServer() (*Server, error) {
	out := make(chan []*Message, 10000)
	from_socket := make(chan *Message, 10000)
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
			case msgs := <-out:
                count := 0
                for _, msg := range msgs {
                    count += 1
                    server.sockets[msg.Id].Out <- msg
                }
                log.Printf("server sent %v messages", count)

			case msg := <-from_socket:
				if msg.Type == websocket.CloseMessage {
					delete(server.sockets, msg.Id)
				}
				server.In <- msg
			}
		}
	}()

	return &server, nil
}

func (s *Server) HandleNewConnection(w http.ResponseWriter, r *http.Request) {

	s.lock.Lock()
	id := s.currentId
	s.currentId += 1

	socket, err := NewSocket(id, s.from_socket, w, r)

	s.sockets[id] = socket
	s.lock.Unlock()

	if err != nil {
		log.Print("couldn't upgrade socket.", err)
		return
	}
}
