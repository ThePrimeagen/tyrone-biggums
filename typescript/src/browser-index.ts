import createRxJSGame from "./game_loop/game-rxjs";
import createCallbackJSGame from "./game_loop/game-callback";
import { CallbackSocket, RxSocket } from "./server/universal-types";
import { createMessage, Message, MessageType } from "./message";
import { BehaviorSubject, Observable, Subject } from "rxjs";

const urlSearchParams = new URLSearchParams(window.location.search);
type Params = {
    style: "rxjs" | "callback",
    count: number;
}

//@ts-ignore
const params = Object.fromEntries(urlSearchParams.entries()) as Params;
if (!params.style) {
    params.style = "callback";
}

if (!params.count) {
    params.count = 200;
}

function wait(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
}

console.log(params);
function noop() {};

const fireCommand = createMessage(MessageType.Fire);
class _RxSocket {
    events: Subject<Message>;
    done: boolean = false;

    closed!: () => void;
    constructor() {
        this.events = new Subject<Message>();
    }

    push(data: object, cb?: () => void): void {
        const m = data as Message;
        if (m.type === MessageType.GameOver) {
            this.done = true;
        } else if (m.type === MessageType.Play) {
            this.play();
        }
    }

    private async play() {
        do {
            this.events.next(fireCommand)
            await wait(200);
        } while (!this.done);
    }

    close(code: number): void {
        this.done = true;
        this.closed();
    }
}

class _CallbackSocket {
    onclose!: () => void;
    onmessage!: (message: Message) => void;
    onerror!: (e: Error) => void;
    events: Subject<Message>;
    done: boolean = false;

    closed!: () => void;

    constructor() {
        this.events = new Subject<Message>();
        this.onmessage = this.onclose = this.onerror = noop;
    }

    push(data: object, cb?: () => void): void {
        const m = data as Message;
        if (m.type === MessageType.GameOver) {
            this.done = true;
        } else if (m.type === MessageType.Play) {
            this.play();
        }
    }

    private async play() {
        do {
            this.onmessage(fireCommand);
            await wait(200);
        } while (!this.done);
    }

    close(code: number): void {
        this.done = true;
        this.closed();
    }

    clean(): void {
    }
}

function createSocket(style: "rxjs"): RxSocket;
function createSocket(style: "callback"): CallbackSocket;
function createSocket(style: "rxjs" | "callback"): CallbackSocket | RxSocket {
    //@ts-ignore
    if (params.style === "rxjs") {
        return new _RxSocket();
    }
    return new _CallbackSocket();
}

class _RxServer {
    // @ts-ignore
    listening: BehaviorSubject<boolean> = new BehaviorSubject(true);
    sub: Subject<[RxSocket, RxSocket]> = new Subject();
    on(): Observable<[RxSocket, RxSocket]> {
        return this.sub;
    }
    close(): void {}
}

class _CallbackServer {
    ongame!: (s1: CallbackSocket, s2: CallbackSocket) => void;
    onlisten!: () => void;
    close() {};
}

function playRx(style: "rxjs") {
    const server = new _RxServer();
    createRxJSGame(server);
}

function playCallback(style: "callback") {
    const server = new _CallbackServer();
    createCallbackJSGame(server);
}

if (params.style === "rxjs") {
    playRx(params.style);
} else {
    playCallback(params.style);
}
