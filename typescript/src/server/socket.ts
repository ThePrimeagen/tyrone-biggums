import { EventEmitter } from "events";
import WebSocket from "ws";
import { createMessage, Message } from "../message";

export interface Socket extends EventEmitter {
    id: number,

    push(msg: Message): void;
    close(code?: number): void;

    // Events
    on(event: "error", cb: (this: Socket, error: Error) => void): this;
    on(event: "message", cb: (this: Socket, msg: Message) => void): this;
    on(event: "close", cb: (this: Socket, id: number) => void): this;
}

export default class SocketImpl extends EventEmitter implements Socket {
    constructor(private socket: WebSocket, public id: number) {
        super();

        this.socket.on("message", (msg) => {
            this.emit("message", createMessage(this.id, msg.toString()));
        });

        this.socket.on("close", () => {
            this.emit("close", this.id);
        });
    }

    push(msg: Message): void {
        if (this.socket.readyState > WebSocket.OPEN) {
            this.emit("close");
            return;
        }

        this.socket.send(msg.msg, (e: Error | undefined) => {
            if (e) {
                this.emit("error", e);
            }
        });
    }

    close(code?: number): void {
        this.socket.close(code);
    }
}

