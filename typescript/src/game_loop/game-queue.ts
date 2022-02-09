import { Message } from "../message";
import { Socket } from "../server/socket";
import { Socket as SocketRxJS } from "../server/rxjs-socket";
import { BaseSocket } from "../server/universal-types";

type MessageEnvelope = {
    message: Message
    from: BaseSocket
}

export interface GameQueue {
    flush(): MessageEnvelope[];
}

export default class GameQueueImpl {
    private queue: MessageEnvelope[];
    constructor(private p1: Socket, private p2: Socket) {
        this.queue = [];
        this.listenToSocket(this.p1);
        this.listenToSocket(this.p2);
    }

    private listenToSocket(from: Socket) {
        from.on("message", (message: Message) => {
            this.queue.push({
                message,
                from,
            });
        });
    }

    // technically if this is an issue we can make it return a dummy array.
    flush(): MessageEnvelope[] {
        const messages = this.queue;
        this.queue = [];
        return messages;
    }
}

export class GameQueueRxJSImpl {
    private queue: MessageEnvelope[];
    constructor(private p1: SocketRxJS, private p2: SocketRxJS) {
        this.queue = [];
        this.listenToSocket(this.p1);
        this.listenToSocket(this.p2);
    }

    private listenToSocket(from: SocketRxJS) {
        from.events.subscribe((message: Message) => {
            this.queue.push({
                message,
                from,
            });
        });
    }

    // technically if this is an issue we can make it return a dummy array.
    flush(): MessageEnvelope[] {
        const messages = this.queue;
        this.queue = [];
        return messages;
    }
}
