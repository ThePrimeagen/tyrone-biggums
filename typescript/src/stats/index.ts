
export class GameStat {
    frameBuckets: number[]
    constructor() {
        this.frameBuckets = new Array(5).fill(0);
    }

    addDelta(delta: number) {
        if (delta > 40) {
            this.frameBuckets[4]++;
        } else if (delta > 30) {
            this.frameBuckets[3]++;
        } else if (delta > 23) {
            this.frameBuckets[2]++;
        } else if (delta > 17) {
            this.frameBuckets[1]++;
        } else {
            this.frameBuckets[0]++;
        }
    }
}

