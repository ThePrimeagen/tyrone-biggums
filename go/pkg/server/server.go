package server

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

type Server struct {
	Out <-chan [2]*Socket

	out chan [2]*Socket
    other_socket *Socket
}

var upgrader = websocket.Upgrader{} // use default options

func NewServer() (*Server, error) {
	out := make(chan [2]*Socket, 10)
	server := Server{
		Out: out,
		out: out,
        other_socket: nil,
	}

	return &server, nil
}

func (s *Server) HandleNewConnection(w http.ResponseWriter, r *http.Request) {

    socket, err := NewSocket(w, r)

	if err != nil {
		log.Fatalln("couldn't upgrade socket.", err)
		return
	}

    if s.other_socket != nil {
        s.out <- [2]*Socket{s.other_socket, socket}
    } else {
        s.other_socket = socket
    }
}
