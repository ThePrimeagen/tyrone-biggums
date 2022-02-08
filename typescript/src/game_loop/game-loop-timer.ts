import { BehaviorSubject, interval, map, Observable, Subject, Subscription } from "rxjs";
import { explodePromise } from "../promise-helpers";

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

export default class GameLoopTimerImpl implements GameLoopTimer, StoppableTimer {
    private tickRate: number;
    private running: boolean;
    private timerId?: ReturnType<typeof setTimeout>;

    constructor(fps: number) {
        this.tickRate = 1000 / fps;
        this.running = false;
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
        let lastTime: number = Date.now();
        const run = () => {

            if (!this.running) {
                return;
            }

            const currentTime = Date.now();
            const diff = currentTime - lastTime;

            try {
                cb(diff);
            } catch (e) {
                console.error(e);
            }

            const opDiff = Date.now() - currentTime;
            lastTime = currentTime;

            if (opDiff < this.tickRate) {
                this.timerId = setTimeout(run, this.tickRate - opDiff);
            } else {
                setImmediate(run);
            }
        }

        run();
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
                })
            ).subscribe((diff) => {
                this.subject.next(diff);
            });

            this.subject.next(0);
        }

        return this.subject;
    }
}

