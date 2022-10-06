package memqueue

import (
	"sync/atomic"
	"unsafe"
)

// Lock free
type MemQueue[T any] struct {
	head unsafe.Pointer
	tail unsafe.Pointer
}

type node[T any] struct {
	value T
	next  unsafe.Pointer
}

// New creates a queue with dummy node.
func NewMemQueue[T any]() *MemQueue[T] {
	node := unsafe.Pointer(new(node[T]))
	return &MemQueue[T]{
		head: node,
		tail: node,
	}
}

// Enqueue push back the given value v to queue.
func (q *MemQueue[T]) Enqueue(v T) {
	node := &node[T]{value: v}
	for {
		tail := load[T](&q.tail)
		next := load[T](&tail.next)
		if tail == load[T](&q.tail) {
			if next == nil {
				if cas(&tail.next, next, node) {
					cas(&q.tail, tail, node)
					return
				}
			} else {
				cas(&q.tail, tail, next)
			}
		}
	}
}

// Dequeue pop front a value from queue
func (q *MemQueue[T]) Dequeue() (v T, ok bool) {
	for {
		head := load[T](&q.head)
		tail := load[T](&q.tail)
		next := load[T](&head.next)
		if head == load[T](&q.head) {
			if head == tail {
				if next == nil {
					var zero T
					return zero, false
				}
				cas(&q.tail, tail, next)
			} else {
				v := next.value
				if cas(&q.head, head, next) {
					return v, true
				}
			}
		}
	}
}

func load[T any](p *unsafe.Pointer) *node[T] {
	return (*node[T])(atomic.LoadPointer(p))
}

func cas[T any](p *unsafe.Pointer, old, new *node[T]) bool {
	return atomic.CompareAndSwapPointer(p,
		unsafe.Pointer(old), unsafe.Pointer(new))
}
