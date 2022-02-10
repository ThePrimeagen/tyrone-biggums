import { Subject } from "rxjs";
import WebSocket from "ws";
import { createMessage, Message } from "../message";
import { BaseSocket } from "./universal-types";

export interface Socket {
    close(code?: number): void;
    push(data: object, cb?: () => void): void;
    events: Subject<Message>;
}

export default class SocketImpl implements Socket, BaseSocket {
    events: Subject<Message>;

    constructor(private socket: WebSocket) {
        this.events = new Subject<Message>();

        this.socket.on("message", (msg) => {
            this.events.next(JSON.parse(msg.toString()));
        });

        this.socket.on("close", () => {
            this.events.complete();
        });

        this.socket.on("error", (e: Error) => {
            this.events.error(e);
        });
    }

    close(code?: number): void {
        this.socket.close(code);
    }

    push(data: object, cb?: () => void): void {
        this.socket.send(JSON.stringify(data), cb);
    }
}


