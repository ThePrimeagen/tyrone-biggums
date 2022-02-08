import WebSocket from "ws";
import { NonDogShitEventEmitter } from "../event-emitter-because-people-told-me-it-was-dogshit";
import { createMessage, Message } from "../message";

export interface Socket {
    // Events
    push(data: object, cb?: () => void): void;

    on(event: "error", cb: (error: Error) => void): void;
    on(event: "message", cb: (msg: Message) => void): void;
    on(event: "close", cb: () => void): void;
}

export default class SocketImpl implements NonDogShitEventEmitter, Socket {
    constructor(private socket: WebSocket) {
        this.socket.on("message", (msg) => {
            this.emit("message", createMessage(msg.toString()));
        });

        this.socket.on("close", () => {
            this.emit("close");
        });

        this.socket.on("error", (e: Error) => {
            this.emit("error", e);
        });
    }

    close(code?: number): void {
        this.socket.close(code);
    }

    push(data: object, cb?: () => void): void {
        this.socket.send(JSON.stringify(data), cb);
    }
}

