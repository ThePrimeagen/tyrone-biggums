import WebSocket from "ws";
import Socket, { noop } from "./socket";

import ObjectPool from "../game_loop/pool"

export interface Server {
    close(): void;
    ongame: (p1: Socket, p2: Socket) => void;
    onlisten: (e?: Error) => void;
    release: (socket: Socket) => void;
}

export default class ServerImpl implements Server {
    public ongame: (p1: Socket, p2: Socket) => void;
    public onlisten: (e?: Error) => void;

    private other_socket?: Socket;
    private server?: WebSocket.WebSocketServer;
    private pool: ObjectPool<WebSocket, Socket>;

    constructor(port: number = 42069) {
        this.ongame = noop;
        this.onlisten = noop;

        this.pool = new ObjectPool<WebSocket, Socket>(2000, () => {
            return new Socket();
        });

        this.server = new WebSocket.Server({
            host: "0.0.0.0",
            port,
        });
        this.startServer(this.server);
    }

    public release(socket: Socket): void {
        this.pool.push(socket);
    }

    private startServer(server: WebSocket.Server) {
        server.on("connection", ws => {
            const socket = this.pool.pop(ws);

            if (this.other_socket) {
                this.ongame(this.other_socket, socket);
                this.other_socket = undefined;
            } else {
                this.other_socket = socket;
            }
        });

        server.on("listening", (e?: Error) => this.onlisten(e));
    }

    public close() {
        // TODO: Why doesn't this close the server?
        this.server?.close();
        this.server = undefined;
    }
}

