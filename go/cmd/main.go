package main

import (
	"flag"
	"log"
	"net/http"
	"sync"

	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
)

var addr = flag.String("addr", "localhost:42069", "http service address")

func main() {
    flag.Parse()
	log.SetFlags(0)

    var wg sync.WaitGroup
    server, err := server.NewServer(&wg)

    if err != nil {
        log.Fatalf("%+v\n", err)
    }

	http.HandleFunc("/", server.HandleNewConnection)
	log.Fatal(http.ListenAndServe(*addr, nil))
}

