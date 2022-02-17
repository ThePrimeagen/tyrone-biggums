import { CallbackSocket } from "../server/socket";
import { RxSocket as SocketRxJS } from "../server/rxjs-socket";
import { Subject } from "rxjs";
import { Message } from "../message";

export function createSocket(): CallbackSocket {
    return {
        push: jest.fn(),
        close: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
    };
}

export function createSocketRxJS(): SocketRxJS {
    return {
        close: jest.fn(),
        push: jest.fn(),
        events: new Subject<Message>(),
    };
}
