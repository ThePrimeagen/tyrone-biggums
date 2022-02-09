import { Socket } from "../server/socket";
import { Socket as SocketRxJS } from "../server/rxjs-socket";
import { Subject } from "rxjs";
import { Message } from "../message";

export function createSocket(): Socket {
    return {
        push: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
    };
}

export function createSocketRxJS(): SocketRxJS {
    return {
        push: jest.fn(),
        events: new Subject<Message>(),
    };
}
