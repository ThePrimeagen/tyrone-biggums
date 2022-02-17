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
  private readonly socketPairs: Observable<[Socket, Socket]>;
  public readonly listening: Promise<any>;
  private server: WebSocket.Server;

  constructor(port: number = 42069) {
    this.server = new WebSocket.Server({
      host: "0.0.0.0",
      port,
    });
    this.listening = once(this.server, "listening");

    this.socketPairs = new Observable((subscriber) => {
      const server = this.server;
      let group: Socket[] = [];

      server.on("connection", (ws) => {
        group.push(new Socket(ws));
        if (group.length === 2) {
          subscriber.next(group as [Socket, Socket]);
          group = [];
        }
      });

      server.on("error", (e) => {
        subscriber.error(e);
      });

      server.on("close", () => {
        subscriber.complete();
      });
    });
  }

  close(): void {
    this.server.close();
  }

  public on(): Observable<[Socket, Socket]> {
    return this.socketPairs;
  }
}
