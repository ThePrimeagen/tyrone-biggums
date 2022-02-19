import { Message } from "../message";
import { BaseSocket, CallbackSocket, RxSocket } from "../server/universal-types";
import { ArrayPool, Pool } from "./pool";

type MessageEnvelope = {
    message: Message
    from: BaseSocket
}

export interface GameQueue {
    flush(): MessageEnvelope[] | undefined;
}

const arrPool = new ArrayPool<MessageEnvelope>(2000);
arrPool.seed(1000); // wee need to seed the cache to prevent giving back and
// taking of the same array

const queuePool = new Pool<GameQueueImpl>(700, () => new GameQueueImpl());
const messagePool = new Pool<MessageEnvelope>(300, () => {return {} as MessageEnvelope;});

export default class GameQueueImpl implements GameQueue {
    private queue!: MessageEnvelope[];
    private p1!: CallbackSocket;
    private p2!: CallbackSocket;
    private boundOnMessage1: (message: Message) => void;
    private boundOnMessage2: (message: Message) => void;

    constructor() {
        this.boundOnMessage1 = (message: Message) => {
            const msg = messagePool.fromCache();
            msg.message = message;
            msg.from = this.p1;
            this.queue.push(msg);
        };
        this.boundOnMessage2 = (message: Message) => {
            const msg = messagePool.fromCache();
            msg.message = message;
            msg.from = this.p2;
            this.queue.push(msg);
        };
    }

    releaseMessages(messages: MessageEnvelope[]) {
        GameQueueImpl.releasePool(messages)
    }

    start(p1: CallbackSocket, p2: CallbackSocket): void {
        p1.onmessage = this.boundOnMessage1;
        p2.onmessage = this.boundOnMessage2;
        this.p1 = p1;
        this.p2 = p2;
        this.queue = arrPool.create();
    }

    // technically if this is an issue we can make it return a dummy array.
    flush(): undefined | MessageEnvelope[] {
        if (this.queue.length === 0) {
            return undefined;
        }

        const messages = this.queue;
        this.queue = arrPool.create();

        return messages;
    }

    private static releasePool(messages: MessageEnvelope[]): void {
        for (let i = 0; i < messages.length; i++) {
            messagePool.toCache(messages[i]);
        }
        arrPool.toCache(messages);
    }

    static release(queue?: GameQueueImpl) {
        if (queue) {
            GameQueueImpl.releasePool(queue.queue);
            queuePool.toCache(queue);
        }
    }

    static create(): GameQueueImpl {
        return queuePool.fromCache();
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
    flush(): MessageEnvelope[] | undefined{
        if (this.queue.length === 0) {
            return undefined;
        }
        const messages = this.queue;
        this.queue = [];
        return messages;
    }
}
