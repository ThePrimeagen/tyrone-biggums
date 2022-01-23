package server

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

type Server struct {
	sockets   map[uint]*Socket
	currentId uint
	In        chan *Message
	Out       chan *Message
}

var upgrader = websocket.Upgrader{} // use default options

func NewServer() (*Server, error) {
	return &Server{
		currentId: 0,
		sockets:   make(map[uint]*Socket),
        In: make(chan *Message),
        Out: make(chan *Message),
	}, nil
}

func (s *Server) HandleNewConnection(w http.ResponseWriter, r *http.Request) {

	id := s.currentId
	s.currentId += 1

	socket, err := NewSocket(id, s.In, w, r)

    go func() {
        for msg := range s.Out {
            s.sockets[msg.Id].Out <- msg
        }
    }()

	if err != nil {
		log.Print("couldn't upgrade socket.", err)
		return
	}

	s.sockets[id] = socket
}
