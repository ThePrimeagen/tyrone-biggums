import { createLoserMessage, createMessage, createWinnerMessage, errorGameOver, MessageType } from "../message";
import { Server } from "../server/callback-server";
import { CallbackSocket } from "../server/universal-types";
import { GameStat } from "../stats";
import GameLoopTimer from "./game-loop-timer";
import GameQueue from "./game-queue";
import { setupWithCallbacks } from "./game-setup";
import GameWorld from "./game-world";
import { Attachable } from "./pool";

export default function gameCreator(server: Server): void {
    server.ongame = (p1, p2) => {

        // @ts-ignore -- I REALLY SHOULD STOP...
        new Game(p1, p2, server);
    };
}

function getTickRate(): number {
    if (!process.env.TICK_RATE) {
        return 60;
    }
    return +process.env.TICK_RATE || 60;
}

export function runGameLoop(loop: GameLoopTimer, queue: GameQueue, world: GameWorld, cb: (stats: GameStat) => void) {
    const stats = GameStat.create();
    loop.start((delta: number) => {
        stats.addDelta(delta);
        // 1. process messages
        const msgs = queue.flush();
        if (msgs) {
            msgs.forEach(m => world.processMessage(m.from, m.message));
        }

        // 2. update all positions
        world.update(delta);

        // 3. process collisions
        world.collisions();

        // 4. check for ending conditions
        if (world.done) {
            loop.stop();
            cb(stats);
        }
    });
}

class Game {
    private loop: GameLoopTimer;
    private queue!: GameQueue;
    private world!: GameWorld;
    private endedWithError: boolean;

    constructor(private p1: CallbackSocket & Attachable<WebSocket>, private p2: CallbackSocket & Attachable<WebSocket>, private server: Server) {
        this.loop = GameLoopTimer.create();
        this.endedWithError = false;

        setupWithCallbacks(p1, p2, (error?: Error) => {
            if (error) {
                // TODO:?
            } else {
                this.startTheGame();
            }
        });
    }

    private stop(other: CallbackSocket): void {
        other.push(errorGameOver("The other player disconnected"));
        other.close();
        this.loop.stop();
        this.endedWithError = true;
        GameStat.activeGames--;
    }

    private startTheGame(): void {
        this.queue = new GameQueue(this.p1, this.p2);
        this.world = new GameWorld(this.p1, this.p2);

        this.p1.push(createMessage(MessageType.Play));
        this.p2.push(createMessage(MessageType.Play));

        this.p1.onclose = () => {
            if (!this.world.done) {
                this.stop(this.p2);
            }
        };

        this.p2.onclose = () => {
            if (!this.world.done) {
                this.stop(this.p1);
            }
        };

        GameStat.activeGames++;

        runGameLoop(this.loop, this.queue, this.world, (stats: GameStat) => {
            this.endGame(stats);
            GameStat.release(stats);
        });
    }

    private endGame(stats: GameStat): void {
        this.world.stop();

        if (this.endedWithError) {
            this.release();
            return;
        }

        const winner = this.world.getWinner();
        const loser = this.world.getLoser();

        winner.push(createWinnerMessage(stats), () => winner.close());
        loser.push(createLoserMessage(), () => loser.close());
        this.release();
        GameStat.activeGames--;
    }

    private release() {
        // @ts-ignore -- I REALLY should stop doing this...
        this.server.release(this.p1);
        // @ts-ignore -- I REALLY should stop doing this...
        this.server.release(this.p2);
        GameLoopTimer.release(this.loop);
    }
}

