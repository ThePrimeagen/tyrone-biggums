import WebSocket from "ws";
import Socket from "./rxjs-socket";
import {
  BehaviorSubject,
  filter,
  map,
  Observable,
  Observer,
  scan,
  Subject,
} from "rxjs";
import { once } from "events";

export interface Server {
  listening: Promise<any>;
  close(): void;
  on(): Observable<[Socket, Socket]>;
}

export default class ServerImpl implements Server {
  private subject: Subject<[Socket, Socket]>;
  public readonly listening: Promise<any>;
  private server: WebSocket.Server;

  constructor(port: number = 42069) {
    this.subject = new Subject<[Socket, Socket]>();
    this.server = new WebSocket.Server({
      host: "0.0.0.0",
      port,
    });
    this.listening = once(this.server, "listening");

    const server = this.server;
    const observable: Observable<WebSocket> = Observable.create(
      (observer: Observer<WebSocket>) => {
        server.on("connection", (ws) => {
          observer.next(ws);
        });
      }
    );

    observable
      .pipe(
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
          return [new Socket(group[0]), new Socket(group[1])];
        })
      )
      .subscribe((socketGroup: [Socket, Socket]) => {
        this.subject.next(socketGroup);
      });

    server.on("error", (e) => {
      this.subject.error(e);
    });

    server.on("close", () => {
      this.subject.complete();
    });
  }

  close(): void {
    this.subject.complete();
    this.server.close();
  }

  public on(): Observable<[Socket, Socket]> {
    return this.subject;
  }
}
