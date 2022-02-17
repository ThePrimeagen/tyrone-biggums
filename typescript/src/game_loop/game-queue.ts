import { Message } from "../message";
import { BaseSocket, CallbackSocket } from "../server/universal-types";

type MessageEnvelope = {
  message: Message;
  from: BaseSocket;
};

export interface GameQueue {
  flush(): MessageEnvelope[] | undefined;
}

export default class GameQueueImpl implements GameQueue {
  private queue: MessageEnvelope[];
  constructor(private p1: CallbackSocket, private p2: CallbackSocket) {
    this.queue = [];
    this.listenToSocket(this.p1);
    this.listenToSocket(this.p2);
  }

  private listenToSocket(from: CallbackSocket) {
    from.onmessage = (message: Message) => {
      this.queue.push({
        message,
        from,
      });
    };
  }

  // technically if this is an issue we can make it return a dummy array.
  flush(): undefined | MessageEnvelope[] {
    if (this.queue.length === 0) {
      return undefined;
    }

    const messages = this.queue;
    this.queue = [];
    return messages;
  }
}

export class GameQueueRxJSImpl implements GameQueue {
  private queue: MessageEnvelope[];
  constructor(private p1: RxSocket, private p2: RxSocket) {
    this.queue = [];
    this.listenToSocket(this.p1);
    this.listenToSocket(this.p2);
  }

  private listenToSocket(from: RxSocket) {
    from.events.subscribe((message: Message) => {
      this.queue.push({
        message,
        from,
      });
    });
  }

  // technically if this is an issue we can make it return a dummy array.
  flush(): MessageEnvelope[] | undefined {
    if (this.queue.length === 0) {
      return undefined;
    }
    const messages = this.queue;
    this.queue = [];
    return messages;
  }
}
