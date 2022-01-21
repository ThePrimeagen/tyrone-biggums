package server

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

type Server struct {
    sockets map[uint]*Socket
    currentId uint
}

var upgrader = websocket.Upgrader{} // use default options

func NewServer(wg *sync.WaitGroup) (*Server, error) {
    wg.Add(1)

    return &Server{
        currentId: 0,
        sockets: make(map[uint]*Socket),
    }, nil
}

func (s *Server) HandleNewConnection(w http.ResponseWriter, r *http.Request) {

    id := s.currentId
    s.currentId += 1;

    socket, err := NewSocket(id, w, r)

	if err != nil {
		log.Print("couldn't upgrade socket.", err)
		return
	}

    s.sockets[id] = socket;
}


