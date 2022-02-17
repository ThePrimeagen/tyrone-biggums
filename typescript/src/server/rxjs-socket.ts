import { Subject } from "rxjs";
import WebSocket from "ws";
import { createMessage, Message } from "../message";
import { BaseSocket, RxSocket } from "./universal-types";

export default class SocketImpl implements RxSocket, BaseSocket {
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


