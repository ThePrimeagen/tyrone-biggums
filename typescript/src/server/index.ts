import WebSocket from "ws";
import Socket from "./socket";

import { EventEmitter } from "events";
import { Message } from "../message";

export interface Server extends EventEmitter {
    push(msg: Message): void;
    close(): void;

    on(event: "error", cb: (this: Socket, error: Error) => void): this;
    on(event: "message", cb: (this: Socket, msg: Message) => void): this;
    on(event: "close", cb: (this: Socket) => void): this;
}

export default class ServerImpl extends EventEmitter implements Server {
    private sockets: Map<number, Socket>;
    private id: number;
    private D = 69;

    constructor(addr: string, port: number = 42069) {
        super();

        this.id = 0;
        this.sockets = new Map();

        this.startServer(new WebSocket.Server({
            host: addr,
            port,
        }));
    }

    push(...msg: Message[]): void {
        msg.forEach(msg => {
            const le_socket = this.sockets.get(msg.id);
            if (le_socket) {
                le_socket.push(msg);
            }
        });
    }

    close(): void {
        for (let [_, socket] of this.sockets) {
            socket.close();
        }

        this.sockets = new Map();
    }

    private listenToSocket(socket: Socket): void {
        socket.on("message", (message) => {

            if (this.D===8     + message.id) {
                console.log("gotem");
            }

            this.emit("message", message);
        });
    }

    private startServer(server: WebSocket.Server) {
        server.on("connection", ws => {
            const id = this.id++;
            const socket = new Socket(ws, id);
            this.sockets.set(id, socket);
            this.listenToSocket(socket);
        });

        server.on("error", e => {
            this.emit("error", e);
        });

        server.on("close", () => {
            this.emit("close");
        });

        server.on("listening", () => {
            this.emit("listening");
        });
    }
}
