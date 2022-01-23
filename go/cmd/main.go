package main

import (
	"flag"
	"log"
	"net/http"

	"github.com/ThePrimeagen/tyrone-biggums/pkg/chat"
	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
)

var addr = flag.String("addr", "localhost:42069", "http service address")

func main() {
    flag.Parse()
	log.SetFlags(0)

    server, err := server.NewServer()
    chat.StartChat(server.In, server.Out)

    if err != nil {
        log.Fatalf("%+v\n", err)
    }

	http.HandleFunc("/", server.HandleNewConnection)
	log.Fatal(http.ListenAndServe(*addr, nil))
}

