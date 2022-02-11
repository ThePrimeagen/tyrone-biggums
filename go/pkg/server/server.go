package server

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{} // use default options

func NewSocketServer() (*http.ServeMux, <-chan [2]*Socket) {
	socketPairs := make(chan [2]*Socket, 9)
	mux := http.NewServeMux()

	mux.HandleFunc("/", func() http.HandlerFunc {
		var pendingSocket *Socket
		var mutex sync.Mutex

		return func(w http.ResponseWriter, r *http.Request) {
			socket, err := NewSocket(w, r)
			if err != nil {
				log.Fatalln("couldn't upgrade socket.", err)
			}

			mutex.Lock()
			defer mutex.Unlock()

			if pendingSocket == nil {
				pendingSocket = socket
				return
			}

			socketPairs <- [2]*Socket{pendingSocket, socket}
			pendingSocket = nil
		}
	}())

	return mux, socketPairs
}
