
export type Callback = (args?: any) => void;

export interface NonDogShitEventEmitter {
    emit(eventName: string, args?: any): void;
    on(eventName: string, cb: Callback): void;
    off(eventName: string, cb: Callback): void;
    offAll(): void;
}

export default class EventEmitterBecausePeopleToldMeItWasDogShit implements NonDogShitEventEmitter {
    private callbacks: Map<String, Callback[]> | undefined;

    constructor() {
        this.callbacks = new Map<String, Callback[]>();
    }

    emit(eventName: string, args?: any): void {
        const callbacks = this.callbacks?.get(eventName);

        if (!callbacks) {
            return;
        }

        for (let i = 0; i < callbacks.length; i++) {
            callbacks[i](args); // bad for perf?
        }
    }

    public on(eventName: string, cb: Callback): void {
        let callbacks = this.callbacks?.get(eventName);
        if (!callbacks) {
            callbacks = [];
            this.callbacks?.set(eventName, callbacks);
        }

        callbacks.push(cb);
    }

    public off(eventName: string, cb: Callback): void {
        let callbacks = this.callbacks?.get(eventName);
        if (!callbacks) {
            return;
        }

        const idx = callbacks.indexOf(cb);
        if (idx != -1) {
            callbacks.splice(idx, 1);
        }
    }

    public offAll(): void {
        this.callbacks = undefined;
    }
}

