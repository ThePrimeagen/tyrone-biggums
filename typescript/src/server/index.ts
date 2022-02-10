import WebSocket from "ws";
import Socket from "./socket";

import EventEmitterBecausePeopleToldMeItWasDogShit from "../event-emitter-because-people-told-me-it-was-dogshit";

export interface Server extends EventEmitterBecausePeopleToldMeItWasDogShit {
    close(): void;
    on(event: "error", cb: (error: Error) => void): void;
    on(event: "close", cb: () => void): void;
    on(event: "game", cb: (sockets: [Socket, Socket]) => void): void;
}

export default class ServerImpl extends EventEmitterBecausePeopleToldMeItWasDogShit implements Server {
    private other_socket?: Socket;
    private server: WebSocket.WebSocketServer;

    constructor(addr: string, port: number = 42069) {
        super();
        this.server = new WebSocket.Server({
            host: addr,
            port,
        });
        this.startServer(this.server);
    }

    private startServer(server: WebSocket.Server) {
        server.on("connection", ws => {
            const socket = new Socket(ws);
            if (this.other_socket) {
                this.emit("game", [this.other_socket, socket]);
                this.other_socket = undefined;
            } else {
                this.other_socket = socket;
            }
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

    public close() {
        this.server.close();
    }
}
