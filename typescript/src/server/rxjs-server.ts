import WebSocket from "ws";
import Socket from "./rxjs-socket";
import { Observable } from "rxjs";
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
      const connectionHandler = (ws: WebSocket) => {
        group.push(new Socket(ws));
        if (group.length === 2) {
          subscriber.next(group as [Socket, Socket]);
          group = [];
        }
      };
      server.on("connection", connectionHandler);

      const errorHandler = (e: Error) => {
        subscriber.error(e);
      };
      server.on("error", errorHandler);

      const completeHandler = () => subscriber.complete();
      server.on("close", completeHandler);

      return () => {
        server.off("connection", connectionHandler);
        server.off("error", errorHandler);
        server.off("complete", completeHandler);
      };
    });
  }

  close(): void {
    this.server.close();
  }

  public on(): Observable<[Socket, Socket]> {
    return this.socketPairs;
  }
}
