import { Subject } from "rxjs";
import { Message } from "../message";
import { CallbackSocket, RxSocket } from "../server/universal-types";

export function createSocket(): CallbackSocket {
    return {
        push: jest.fn(),
        close: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
    };
}

export function createSocketRxJS(): RxSocket {
    return {
        close: jest.fn(),
        push: jest.fn(),
        events: new Subject<Message>(),
    };
}
