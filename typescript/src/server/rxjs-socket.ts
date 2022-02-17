import { Observable } from "rxjs";
import WebSocket, { RawData } from "ws";
import { Message } from "../message";
import { BaseSocket, RxSocket } from "./universal-types";

export function fromWebSocket(socket: WebSocket): Observable<Message> {
  return new Observable((subscriber) => {
    const messageHandler = (msg: RawData) =>
      subscriber.next(JSON.parse(msg.toString()));
    socket.on("message", messageHandler);

    const closeHandler = () => subscriber.complete();
    socket.on("close", closeHandler);

    const errorHandler = (e: Error) => subscriber.error(e);
    socket.on("error", errorHandler);

    return () => {
      socket.off("message", messageHandler);
      socket.off("close", closeHandler);
      socket.off("error", errorHandler);
    };
  });
}
export default class SocketImpl implements RxSocket, BaseSocket {
  readonly events: Observable<Message>;

  constructor(private socket: WebSocket) {
    this.events = fromWebSocket(socket);
  }

  close(code?: number): void {
    this.socket.close(code);
  }

  push(data: object, cb?: () => void): void {
    this.socket.send(JSON.stringify(data), cb);
  }
}
