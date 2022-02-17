import { Observable, Subject } from "rxjs";
import WebSocket from "ws";
import { createMessage, Message } from "../message";
import { BaseSocket, RxSocket } from "./universal-types";

export default class SocketImpl implements RxSocket, BaseSocket {
  readonly events: Observable<Message>;

  constructor(private socket: WebSocket) {
    this.events = new Observable((subscriber) => {
      this.socket.on("message", (msg) => {
        subscriber.next(JSON.parse(msg.toString()));
      });

      this.socket.on("close", () => {
        subscriber.complete();
      });

      this.socket.on("error", (e: Error) => {
        subscriber.error(e);
      });
    });
  }

  close(code?: number): void {
    this.socket.close(code);
  }

  push(data: object, cb?: () => void): void {
    this.socket.send(JSON.stringify(data), cb);
  }
}
