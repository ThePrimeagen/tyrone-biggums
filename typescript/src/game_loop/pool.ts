export interface Attachable<T> {
    attach(item?: T): void;
    detach(): void;
}

export default class ObjectPool<E, T extends Attachable<E>> {
    private insertIndex = 0;
    private removalIndex = 0;
    private buffer: T[];

    constructor(initialCapacity: number, private factory: () => T) {
        this.buffer = new Array(initialCapacity);
    }

    capacity(): number {
        return this.buffer.length;
    }

    pop(item?: E): T {
        if (this.insertIndex === this.removalIndex) {
            const out: T = this.factory();
            out.attach(item);
            return out;
        }

        const out = this.buffer[this.removalIndex];
        this.removalIndex = (this.removalIndex + 1) % this.buffer.length;

        out.attach(item);
        return out;
    }

    push(item: T) {
        item.detach();

        this.buffer[this.insertIndex] = item;
        this.insertIndex = (this.insertIndex + 1) % this.buffer.length;

        // we are full
        if (this.insertIndex === this.removalIndex) {
            const nextBuffer = new Array(this.buffer.length * 2);
            for (let i = 0; i < this.buffer.length; i++) {
                nextBuffer[i] = this.buffer[i];
            }
            this.removalIndex = 0;
            this.insertIndex = this.buffer.length; // at the end of the list
            this.buffer = nextBuffer;
        }
    }
}

