import { MessageType } from "../../message";
import { createSocket, createSocketRxJS } from "../../mocks/socket";
import { setupWithCallbacks } from "../game-setup";

test("GameSetup, ready up timeout", function() {
    jest.useFakeTimers();
    const p1 = createSocket();
    const p2 = createSocket();
    const cb = jest.fn();
    setupWithCallbacks(p1, p2, cb, 29001);
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
    setupWithCallbacks(p1, p2, cb, 29001);
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

