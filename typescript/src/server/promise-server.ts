import WebSocket from "ws";
import Socket from "./socket";

import EventEmitterBecausePeopleToldMeItWasDogShit from "../event-emitter-because-people-told-me-it-was-dogshit";

import { ExplodedPromise, explodePromise } from "../promise-helpers";

export interface Server {
    close(): void;
    nextPair(): undefined | Promise<[Socket, Socket]>;
}

export default class ServerImpl extends EventEmitterBecausePeopleToldMeItWasDogShit implements Server {
    private other_socket?: Socket;
    private server: WebSocket.WebSocketServer;
    private promise?: ExplodedPromise<[Socket, Socket]>;
    private listeningPromise: ExplodedPromise<void>;

    constructor(addr: string, port: number = 42069) {
        super();
        this.server = new WebSocket.Server({
            host: addr,
            port,
        });
        this.ready();
        this.listeningPromise = explodePromise();
        this.startServer(this.server);
    }

    nextPair(): undefined | Promise<[Socket, Socket]> {
        return this.promise?.promise;
    }

    private ready(): void {
        this.promise = explodePromise<[Socket, Socket]>();
        this.other_socket = undefined;
    }

    private startServer(server: WebSocket.Server) {
        server.on("connection", ws => {
            const socket = new Socket(ws);
            if (this.other_socket) {
                this.promise?.resolve([socket, this.other_socket]);
                this.ready();
            } else {
                this.other_socket = socket;
            }
        });

        server.on("error", e => {
            this.promise?.reject(e);
            this.close();
        });

        server.on("close", () => {
            this.promise = undefined;
        });

        server.on("listening", () => {
            this.listeningPromise.resolve();
        });

    }

    public close() {
        this.server.close();
        this.promise = undefined;
        this.other_socket = undefined;
    }
}

