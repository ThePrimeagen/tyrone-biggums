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

	mux, socketPairs := server.NewSocketServer()

	go func() {
		for socketPair := range socketPairs {
			// todo: how to listen to this?? more go funcs?
			gameloop.NewGameLoop(socketPair).Run()
		}
	}()

	log.Fatal(http.ListenAndServe(*addr, mux))
}
