type Callback = (delta: number) => void;

interface GameLoopTimer {
    start(cb: Callback): void;
}

export default class GameLoopTimerImpl implements GameLoopTimer {
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

    start(cb: Callback) {
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

