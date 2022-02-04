import { Subject } from "rxjs";
import WebSocket from "ws";
import { createMessage, Message } from "../message";

export interface Socket {
    events: Subject<Message>;
}

let _id = 0;
export default class SocketImpl implements Socket {
    events: Subject<Message>;
    public id: number;

    constructor(private socket: WebSocket) {
        this.id = ++_id;
        this.events = new Subject<Message>();

        this.socket.on("message", (msg) => {
            this.events.next(createMessage(msg.toString()));
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
}


