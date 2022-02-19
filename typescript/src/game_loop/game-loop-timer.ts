import { BehaviorSubject, interval, map, Observable, Subject, Subscription, tap } from "rxjs";
import { explodePromise } from "../promise-helpers";
import AttachablePool, { Attachable, Pool } from "./pool";

type Callback = (delta: number) => void;

interface StoppableTimer {
    stop(): void;
}

interface GameLoopTimer {
    start(cb: Callback): void
}

interface GLRxJSTimer {
    start(): Subject<number>;
}

const timerPool = new Pool<GameLoopTimerImpl>(600, () => new GameLoopTimerImpl(60));
export default class GameLoopTimerImpl implements GameLoopTimer, StoppableTimer {
    private tickRate: number;
    private running: boolean;
    private timerId?: ReturnType<typeof setTimeout>;
    private lastRunTime: number;
    private cb!: Callback;
    private boundRun: () => void;

    constructor(fps: number) {
        this.tickRate = 1000 / fps;
        this.running = false;
        this.lastRunTime = 0;
        this.boundRun = this.run.bind(this);
    }

    stop() {
        this.running = false;
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = undefined;
        }
    }

    start(cb: Callback): void {
        this.running = true;
        this.lastRunTime = Date.now();
        this.cb = cb;

        this.run();
    }

    private run() {
        if (!this.running) {
            return;
        }

        const currentTime = Date.now();
        const diff = currentTime - this.lastRunTime;

        this.cb(diff);

        const opDiff = Date.now() - currentTime;
        this.lastRunTime = currentTime;

        if (opDiff < this.tickRate) {
            this.timerId = setTimeout(this.boundRun, this.tickRate - opDiff);
        } else {
            setImmediate(this.boundRun);
        }
    }

    static create() {
        return timerPool.fromCache();
    }

    static release(timer: GameLoopTimerImpl) {
        timerPool.toCache(timer);
    }
}

export class GameLoopRxJS implements StoppableTimer, GLRxJSTimer {
    private tickRate: number;
    private ticker?: Subscription;
    private subject: BehaviorSubject<number>;

    constructor(fps: number) {
        this.tickRate = 1000 / fps;
        this.subject = new BehaviorSubject<number>(0);
    }

    stop() {
        if (this.ticker) {
            this.ticker.unsubscribe();
            this.ticker = undefined;
        }
    }

    start(): Subject<number> {
        if (!this.ticker) {
            let lastTime: number = Date.now();
            this.ticker = interval(this.tickRate).pipe(
                map(() => {
                    return Date.now() - lastTime;
                }),
                tap(() => {
                    lastTime = Date.now();
                })
            ).subscribe((diff) => {
                this.subject.next(diff);
            });

            this.subject.next(0);
        }

        return this.subject;
    }
}

