import { Observable } from "rxjs";
import { Message } from "../message";

export interface BaseSocket {
  // Events
  push(data: object, cb?: () => void): void;
  close(code?: number): void;
}

export interface CallbackSocket {
  close(code?: number): void;
  push(data: object, cb?: () => void): void;
  onclose?: () => void;
  onmessage?: (message: Message) => void;
  onerror?: (e: Error) => void;
  clean(): void;
}

export interface RxSocket {
  close(code?: number): void;
  push(data: object, cb?: () => void): void;
  events: Observable<Message>;
}
