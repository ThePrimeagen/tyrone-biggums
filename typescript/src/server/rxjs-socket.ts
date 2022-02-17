import { Observable } from "rxjs";
import WebSocket, { RawData } from "ws";
import { Message } from "../message";
import { BaseSocket, RxSocket } from "./universal-types";

export default class SocketImpl implements RxSocket, BaseSocket {
  readonly events: Observable<Message>;

  constructor(private socket: WebSocket) {
    this.events = new Observable((subscriber) => {
      const messageHandler = (msg: RawData) =>
        subscriber.next(JSON.parse(msg.toString()));
      this.socket.on("message", messageHandler);

      const closeHandler = () => subscriber.complete();
      this.socket.on("close", closeHandler);

      const errorHandler = (e: Error) => subscriber.error(e);
      this.socket.on("error", errorHandler);

      return () => {
        this.socket.off("message", messageHandler);
        this.socket.off("close", closeHandler);
        this.socket.off("error", errorHandler);
      };
    });
  }

  close(code?: number): void {
    this.socket.close(code);
  }

  push(data: object, cb?: () => void): void {
    this.socket.send(JSON.stringify(data), cb);
  }
}
