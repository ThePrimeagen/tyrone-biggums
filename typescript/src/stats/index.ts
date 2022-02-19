import AttachablePool, { Attachable } from "../game_loop/pool";

const gamePool = new AttachablePool<null, GameStat>(1000, () => new GameStat());

export class GameStat implements Attachable<null> {
    static activeGames: number = 0;

    frameBuckets: number[]
    constructor() {
        this.frameBuckets = new Array(8).fill(0);
    }

    attach() {
        this.frameBuckets.fill(0);
    }
    detach() { }

    addDelta(delta: number) {
        if (delta > 40) {
            this.frameBuckets[7]++;
        } else if (delta > 30) {
            this.frameBuckets[6]++;
        } else if (delta > 25) {
            this.frameBuckets[5]++;
        } else if (delta > 23) {
            this.frameBuckets[4]++;
        } else if (delta > 21) {
            this.frameBuckets[3]++;
        } else if (delta > 19) {
            this.frameBuckets[2]++;
        } else if (delta > 17) {
            this.frameBuckets[1]++;
        } else {
            this.frameBuckets[0]++;
        }
    }

    static create(): GameStat {
        return gamePool.pop();
    }

    static release(stats: GameStat): void {
        gamePool.push(stats);
    }
}
