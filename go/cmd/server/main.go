package main

import (
	"flag"
	"log"
	"net/http"

	"github.com/ThePrimeagen/tyrone-biggums/pkg/gameloop"
	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
)

func init() {
	log.SetFlags(0)
}

func main() {
	addr := flag.String("addr", "0.0.0.0:42069", "http service address")

	flag.Parse()

	mux, socketPairs := server.NewSocketServer()

	go func() {
		for socketPair := range socketPairs {
			// todo: how to listen to this?? more go funcs?
			gameloop.NewGameLoop(socketPair).Run()
		}
	}()

	log.Println("starting socket server on port", *addr)
	log.Fatal(http.ListenAndServe(*addr, mux))
}
