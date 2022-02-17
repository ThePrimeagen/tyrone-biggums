import { Observable, Subject } from "rxjs";

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
  return new Observable((subscriber) => {
    let lastTime = Date.now();
    subscriber.next(0);
    const id = setInterval(() => {
      const currentTime = Date.now();
      const diff = Date.now() - lastTime;
      lastTime = currentTime;
      subscriber.next(diff);
    }, tickRate);
    return () => clearInterval(id);
  });
}
