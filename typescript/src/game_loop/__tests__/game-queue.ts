import { createSocket, createSocketRxJS } from "../../mocks/socket";
import GameQueue, { GameQueueRxJSImpl } from "../game-queue";

test("GameQueue", function() {
    const p1 = createSocket();
    const p2 = createSocket();
    const queue = new GameQueue(p1, p2);

    expect(p1.on).toHaveBeenCalled();
    expect(p2.on).toHaveBeenCalled();
    expect(queue.flush()).toEqual([])

    // @ts-ignore
    const cb1 = p1.on.mock.calls[0][1];
    // @ts-ignore
    const cb2 = p2.on.mock.calls[0][1];

    cb1("foo");
    expect(queue.flush()).toEqual([{
        message: "foo",
        from: p1,
    }])
    expect(queue.flush()).toEqual([])

    cb2("foo");
    expect(queue.flush()).toEqual([{
        message: "foo",
        from: p2,
    }])
    expect(queue.flush()).toEqual([])

    cb2("foo");
    cb1("foo2");
    expect(queue.flush()).toEqual([{
        message: "foo",
        from: p2,
    }, {
        message: "foo2",
        from: p1,
    }])
    expect(queue.flush()).toEqual([])
});

test("GameQueueRxJS", function() {
    const p1 = createSocketRxJS();
    const p2 = createSocketRxJS();
    const queue = new GameQueueRxJSImpl(p1, p2);

    expect(queue.flush()).toEqual([])

    p1.events.next({msg: "foo"});
    expect(queue.flush()).toEqual([{
        message: {msg: "foo"},
        from: p1,
    }])
    expect(queue.flush()).toEqual([])

    p2.events.next({msg: "foo"});
    expect(queue.flush()).toEqual([{
        message: {msg: "foo"},
        from: p2,
    }])
    expect(queue.flush()).toEqual([])

    p2.events.next({msg: "foo"});
    p1.events.next({msg: "foo2"});
    expect(queue.flush()).toEqual([{
        message: {msg: "foo"},
        from: p2,
    }, {
        message: {msg: "foo2"},
        from: p1,
    }])
    expect(queue.flush()).toEqual([])
});


