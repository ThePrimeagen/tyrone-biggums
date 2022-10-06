package main

import (
	"flag"
	"log"
	"net/http"

	gameloop "github.com/ThePrimeagen/tyrone-biggums/pkg/game_loop"
	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
)

var addr = flag.String("addr", "0.0.0.0:42069", "http service address")

func main() {
	flag.Parse()
	log.SetFlags(0)

	server, err := server.NewServer()

	if err != nil {
		log.Fatalf("%+v\n", err)
	}

	go func() {
		for socketPair := range server.Out {
			// todo: how to listen to this?? more go funcs?
			gameloop.NewGame(socketPair).Run()
		}
	}()

	http.HandleFunc("/", server.HandleNewConnection)
	log.Fatal(http.ListenAndServe(*addr, nil))
}
