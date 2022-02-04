import WebSocket from "ws";
import Socket from "./socket";
import { filter, map, Observable, Observer, scan, Subject } from "rxjs";

export interface Server {
    close(): void;
    on(): Subject<[Socket, Socket]>;
}

export default class ServerImpl {
    private subject: Subject<[Socket, Socket]>;
    constructor(addr: string, port: number = 42069) {
        this.subject = new Subject<[Socket, Socket]>();
        this.startServer(new WebSocket.Server({
            host: addr,
            port,
        }));
    }

    public on(): Subject<[Socket, Socket]> {
        return this.subject;
    }

    private startServer(server: WebSocket.Server) {
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
                return group.length !== 2;
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

        server.on("listening", () => {
            console.log("Server is listening");
        });
    }
}
