import WebSocket from "ws";
import Socket from "./rxjs-socket";
import { BehaviorSubject, filter, map, Observable, Observer, scan, Subject } from "rxjs";

export interface Server {
    listening: BehaviorSubject<boolean>;
    close(): void;
    on(): Observable<[Socket, Socket]>;
}

export default class ServerImpl implements Server {
    private subject: Subject<[Socket, Socket]>;
    public listening: BehaviorSubject<boolean>;
    private server: WebSocket.Server;

    constructor(addr: string, port: number = 42069) {
        this.subject = new Subject<[Socket, Socket]>();
        this.listening = new BehaviorSubject<boolean>(false);
        this.server = new WebSocket.Server({
            host: addr,
            port,
        });
        this.startServer(this.server);
    }

    close(): void {
        this.subject.complete();
        this.server.close();
    }

    public on(): Observable<[Socket, Socket]> {
        return this.subject;
    }

    private startServer(server: WebSocket.Server) {
        this.server = server;
        const observable: Observable<WebSocket> = Observable.create((observer: Observer<WebSocket>) => {
            server.on("connection", ws => {
                observer.next(ws);
            });
        });

        observable.pipe(
            scan((group: WebSocket[], ws: WebSocket) => {
                if (!group || group.length === 2) {
                    group = [];
                }

                group.push(ws);
                return group;
            }, []),
            filter((group: WebSocket[]) => {
                return group.length === 2;
            }),
            map<WebSocket[], [Socket, Socket]>((group: WebSocket[]) => {
                return [
                    new Socket(group[0]),
                    new Socket(group[1]),
                ];
            })
        ).subscribe((socketGroup: [Socket, Socket]) => {
            this.subject.next(socketGroup);
        });

        server.on("error", e => {
            this.subject.error(e);
        });

        server.on("close", () => {
            this.subject.complete();
        });

        server.on("listening", (e?: Error) => {
            console.log("HELLO WORLD");
            if (e) {
                this.listening.error(e);
            } else {
                this.listening.next(true);
            }
        });
    }
}
