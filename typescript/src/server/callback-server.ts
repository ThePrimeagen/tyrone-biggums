import WebSocket from "ws";
import Socket, { noop } from "./socket";

import AttachablePool from "../game_loop/pool"
import { Observable } from "rxjs";

export interface Server {
    close(): void;
    ongame: (p1: Socket, p2: Socket) => void;
    onlisten: (e?: Error) => void;
    release: (socket: Socket) => void;
    ongame$: Observable<[Socket, Socket]>;
    onlisten$: Observable<void>;
}

export default class ServerImpl implements Server {
    public ongame: (p1: Socket, p2: Socket) => void;
    public onlisten: (e?: Error) => void;

    public ongame$!: Observable<[Socket, Socket]>;
    public onlisten$!: Observable<void>;

    private other_socket?: Socket;
    private server?: WebSocket.WebSocketServer;
    private pool: AttachablePool<WebSocket, Socket>;

    constructor(port: number = 42069) {
        this.ongame = noop;
        this.onlisten = noop;

        this.pool = new AttachablePool<WebSocket, Socket>(2000, () => {
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
        this.ongame$ = new Observable((observer) => {
            server.on("connection", ws => {
                const socket = this.pool.pop(ws);

                if (this.other_socket) {
                    // this.ongame(this.other_socket, socket);
                    observer.next([socket, this.other_socket]);
                    this.other_socket = undefined;
                } else {
                    this.other_socket = socket;
                }
            });
        });

        this.onlisten$ = new Observable((observer) => {
            server.on("listening", (e?: Error) => {
                if (e) {
                    observer.error(e);
                } else {
                    observer.next();
                }
                observer.complete();
            });
        });
    }

    public close() {
        // TODO: Why doesn't this close the server?
        this.server?.close();
        this.server = undefined;
    }
}

