import WebSocket from "ws";
import EventEmitterBecausePeopleToldMeItWasDogShit from "../event-emitter-because-people-told-me-it-was-dogshit";
import { Message } from "../message";
import { BaseSocket, CallbackSocket } from "./universal-types";

export default class SocketImpl extends EventEmitterBecausePeopleToldMeItWasDogShit implements CallbackSocket, BaseSocket {

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

