import { MessageType } from "../../message";
import { createSocket, createSocketRxJS } from "../../mocks/socket";
import { setupWithCallbacks, setupWithRxJS, Startable } from "../game-setup";

test("GameSetup, ready up timeout", function() {
    jest.useFakeTimers();
    const p1 = createSocket();
    const p2 = createSocket();
    const cb = jest.fn();
    const startable = {
        start: cb
    } as Startable;

    setupWithCallbacks(p1, p2, startable, 29001);
    expect(cb).toHaveBeenCalledTimes(0);
    expect(p1.push).toHaveBeenCalledTimes(1);
    expect(p2.push).toHaveBeenCalledTimes(1);


    jest.advanceTimersByTime(29000);
    expect(cb).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(1);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(new Error("Timeout"));
});

test("GameSetup, ready up, bad msg", function() {
    jest.useFakeTimers();
    const p1 = createSocket();
    const p2 = createSocket();
    const cb = jest.fn();
    const startable = {
        start: cb
    } as Startable;
    setupWithCallbacks(p1, p2, startable, 29001);
    expect(cb).toHaveBeenCalledTimes(0);
    expect(p1.push).toHaveBeenCalledTimes(1);
    expect(p2.push).toHaveBeenCalledTimes(1);

    // @ts-ignore
    const cb1 = p1.on.mock.calls[0][1];
    // @ts-ignore
    const cb2 = p2.on.mock.calls[0][1];

    jest.advanceTimersByTime(29000);
    expect(cb).toHaveBeenCalledTimes(0);

    cb1({type: MessageType.ReadyUp});
    expect(cb).toHaveBeenCalledTimes(0);

    cb2({type: MessageType.Play});
    expect(cb).toHaveBeenCalledTimes(0);

    cb2({type: MessageType.ReadyUp});
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(undefined);
});

test("GameSetup, ready up timeout", function() {
    jest.useFakeTimers();
    const p1 = createSocketRxJS();
    const p2 = createSocketRxJS();
    const ready$ = setupWithRxJS([p1, p2], 29001);
    const next = jest.fn();
    const error = jest.fn();

    // todo: help me tom cruise
    ready$.subscribe({
        next,
        error
    });

    expect(next).toHaveBeenCalledTimes(0);
    expect(p1.push).toHaveBeenCalledTimes(1);
    expect(p2.push).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(29000);
    expect(next).toHaveBeenCalledTimes(0);
    expect(error).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(1);
    expect(next).toHaveBeenCalledTimes(0);
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith(new Error("Timeout"));
});

test("GameSetupRx, ready up, bad msg", function() {
    jest.useFakeTimers();
    const p1 = createSocketRxJS();
    const p2 = createSocketRxJS();
    const ready$ = setupWithRxJS([p1, p2], 29001);
    expect(p1.push).toHaveBeenCalledTimes(1);
    expect(p2.push).toHaveBeenCalledTimes(1);

    const subbed = jest.fn();
    const errored = jest.fn();
    ready$.subscribe(subbed);

    jest.advanceTimersByTime(29000);
    expect(subbed).toHaveBeenCalledTimes(0);

    p1.events.next({type: MessageType.ReadyUp});
    expect(subbed).toHaveBeenCalledTimes(0);

    p2.events.next({type: MessageType.Play});
    expect(subbed).toHaveBeenCalledTimes(0);

    p2.events.next({type: MessageType.ReadyUp});
    expect(subbed).toHaveBeenCalledTimes(1);
    expect(subbed).toHaveBeenCalledWith([p1, p2]);
    expect(errored).toHaveBeenCalledTimes(0);
});
