import WebSocket from "ws";
import { Message } from "../message";
import { BaseSocket, CallbackSocket } from "./universal-types";

export function noop() {};
export default class SocketImpl implements CallbackSocket, BaseSocket {
    public onmessage: (message: Message) => void = noop;
    public onclose: () => void = noop;
    public onerror: (error: Error) => void = noop;

    constructor(private socket: WebSocket) {
        this.socket.on("message", (msg) => {
            const message = JSON.parse(msg.toString()) as Message;
            this.onmessage(message);
        });

        this.socket.on("close", () => {
            this.onclose();
        });

        this.socket.on("error", (e: Error) => {
            this.onerror(e);
        });
    }

    close(code?: number): void {
        this.socket.close(code);
    }

    push(data: object, cb?: () => void): void {
        this.socket.send(JSON.stringify(data), cb);
    }

    clean(): void {
        this.onclose = this.onerror = this.onmessage = noop;
    }
}

