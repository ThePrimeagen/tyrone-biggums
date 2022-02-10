import WebSocket from "ws";
import EventEmitterBecausePeopleToldMeItWasDogShit, { Callback, NonDogShitEventEmitter } from "../event-emitter-because-people-told-me-it-was-dogshit";
import { Message } from "../message";
import { BaseSocket } from "./universal-types";

export interface Socket {
    close(code?: number): void;
    push(data: object, cb?: () => void): void;
    on(event: "error", cb: (error: Error) => void): void;
    on(event: "message", cb: (msg: Message) => void): void;
    on(event: "close", cb: () => void): void;
    off(event: string, cb: (arg?: any) => void): void;
}

export default class SocketImpl extends EventEmitterBecausePeopleToldMeItWasDogShit implements Socket, BaseSocket {

    constructor(private socket: WebSocket) {
        super();
        this.socket.on("message", (msg) => {
            const message = JSON.parse(msg.toString()) as Message;
            this.emit("message", message);
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

