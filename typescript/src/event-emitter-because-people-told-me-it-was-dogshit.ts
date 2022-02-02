
export type Callback = (args?: any) => void;

export default class EventEmitterBecausePeopleToldMeItWasDogShit {
    private callbacks: Map<String, Callback[]>;

    constructor() {
        this.callbacks = new Map<String, Callback[]>();
    }

    protected emit(eventName: string, args?: any): void {
        const callbacks = this.callbacks.get(eventName);

        if (!callbacks) {
            return;
        }

        for (let i = 0; i < callbacks.length; i++) {
            callbacks[i](args); // bad for perf?
        }
    }

    public on(eventName: string, cb: Callback): void {
        let callbacks = this.callbacks.get(eventName);
        if (!callbacks) {
            callbacks = [];
            this.callbacks.set(eventName, callbacks);
        }

        callbacks.push(cb);
    }
}

