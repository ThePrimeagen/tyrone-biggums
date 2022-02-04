package main

import (
	"log"
	"strconv"
)

type FooFoo[K any] struct {
    Key K
}

// TODO: fix the thing
func do_map[K any, V any](args []K, fn func(K)V) []V {
    out := make([]V, len(args))
    for idx, v := range args {
        out[idx] = fn(v)
    }
    return out
}

type Number interface {
    int64 | int32 | float32 | float64 | int
}

func max[K Number](a K, b K) K {
    if a > b {
        return a
    }
    return b
}

type Foo[K Number] struct {
    answer K
}

type OtherThing interface {
    int32 | float32
}

// Cannot do
/*
func (f *Foo[Number]) add[K OtherThing](other K) OtherThing {
    return f.answer + other.answer;
}
*/

func main() {
    a := []int{1, 5, 10, 25}
    b := do_map(a, func(item int) string {
        return strconv.Itoa(item)
    })

    log.Printf("Hello, World %v", b)
}


