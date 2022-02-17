import {
  BehaviorSubject,
  defer,
  interval,
  map,
  Observable,
  Subject,
  Subscription,
  tap,
} from "rxjs";
import { explodePromise } from "../promise-helpers";

type Callback = (delta: number) => void;

interface StoppableTimer {
  stop(): void;
}

interface GameLoopTimer {
  start(cb: Callback): void;
}

interface GLRxJSTimer {
  start(): Subject<number>;
}

export default class GameLoopTimerImpl
  implements GameLoopTimer, StoppableTimer
{
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
    };

    run();
  }
}

export function getRxJSGameLoop(fps: number): Observable<number> {
  const tickRate = 1000 / fps;
  return defer(() => {
    let lastTime = Date.now();
    return interval(tickRate).pipe(
      map(() => {
        return Date.now() - lastTime;
      }),
      tap(() => {
        lastTime = Date.now();
      })
    );
  });
}

export class GameLoopRxJS implements StoppableTimer, GLRxJSTimer {
  private tickRate: number;
  private tickerSubscription?: Subscription;
  private elapsedSinceLastTick: BehaviorSubject<number>;

  constructor(fps: number) {
    this.tickRate = 1000 / fps;
    this.elapsedSinceLastTick = new BehaviorSubject<number>(0);
  }

  stop() {
    if (this.tickerSubscription) {
      this.tickerSubscription.unsubscribe();
      this.tickerSubscription = undefined;
    }
  }

  start(): Subject<number> {
    if (!this.tickerSubscription) {
      let lastTime: number = Date.now();
      this.tickerSubscription = interval(this.tickRate)
        .pipe(
          map(() => {
            return Date.now() - lastTime;
          }),
          tap(() => {
            lastTime = Date.now();
          })
        )
        .subscribe((diff) => {
          this.elapsedSinceLastTick.next(diff);
        });

      this.elapsedSinceLastTick.next(0);
    }

    return this.elapsedSinceLastTick;
  }
}
