import { Subject } from "rxjs";
import { Message } from "../message";

export interface BaseSocket {
    // Events
    push(data: object, cb?: () => void): void;
    close(code?: number): void;
}

export interface CallbackSocket {
    close(code?: number): void;
    push(data: object, cb?: () => void): void;
    on(event: "error", cb: (error: Error) => void): void;
    on(event: "message", cb: (msg: Message) => void): void;
    on(event: "close", cb: () => void): void;
    off(event: string, cb: (arg?: any) => void): void;
}

export interface RxSocket {
    close(code?: number): void;
    push(data: object, cb?: () => void): void;
    events: Subject<Message>;
}

