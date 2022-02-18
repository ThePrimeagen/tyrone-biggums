import WebSocket from "ws";
import Socket, { noop } from "./socket";

export interface Server {
    close(): void;
    ongame: (p1: Socket, p2: Socket) => void;
    onlisten: (e?: Error) => void;
}

export default class ServerImpl implements Server {
    private other_socket?: Socket;
    private server?: WebSocket.WebSocketServer;
    public ongame: (p1: Socket, p2: Socket) => void;
    public onlisten: (e?: Error) => void;

    constructor(port: number = 42069) {
        this.ongame = noop;
        this.onlisten = noop;
        this.server = new WebSocket.Server({
            host: "0.0.0.0",
            port,
        });
        this.startServer(this.server);
    }

    private startServer(server: WebSocket.Server) {
        server.on("connection", ws => {
            const socket = new Socket(ws);
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

