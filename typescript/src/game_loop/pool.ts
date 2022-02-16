export default class ObjectPool<T> {
    private insertIndex = 0;
    private removalIndex = 0;
    private buffer: T[];

    constructor(initialCapacity: number, private factory: () => T) {
        this.buffer = new Array(initialCapacity);
    }

    capacity(): number {
        return this.buffer.length;
    }

    pop(): T {
        if (this.insertIndex === this.removalIndex) {
            return this.factory();
        }

        const out = this.buffer[this.removalIndex];
        this.removalIndex = (this.removalIndex + 1) % this.buffer.length;
        return out;
    }

    push(item: T) {
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

