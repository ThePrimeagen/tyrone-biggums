import EventEmitterBecausePeopleToldMeItWasDogShit from "../event-emitter-because-people-told-me-it-was-dogshit";
import { createLoserMessage, createWinnerMessage } from "../message";
import { Server } from "../server";
import { Socket } from "../server/socket";
import { failedToConnect } from "../stats";
import GameLoopTimer from "./game-loop-timer";
import GameQueue from "./game-queue";
import { setupWithCallbacks } from "./game-setup";
import GameWorld from "./game-world";


export default function gameCreator(server: Server): void {
    server.on("game", ([p1, p2]) => {
        new Game(p1, p2);
    });
}

function getTickRate(): number {
    if (!process.env.TICK_RATE) {
        return 60;
    }
    return +process.env.TICK_RATE || 60;
}

export function runGameLoop(loop: GameLoopTimer, queue: GameQueue, world: GameWorld, cb: () => void): void {
    loop.start((delta: number) => {
        // 1. process messages
        queue.flush().forEach(m => world.processMessage(m.from, m.message));

        // 2. update all positions
        world.update(delta);

        // 3. process collisions
        world.collisions();

        // 4. check for ending conditions
        if (world.done) {
            loop.stop();
            cb();
        }
    });
}

class Game extends EventEmitterBecausePeopleToldMeItWasDogShit {
    private loop: GameLoopTimer;
    private queue!: GameQueue;
    private world!: GameWorld;

    constructor(private p1: Socket, private p2: Socket) {
        super();
        this.loop = new GameLoopTimer(getTickRate());

        setupWithCallbacks(p1, p2, (error?: Error) => {
            if (error) {
                failedToConnect();
            } else {
                this.startTheGame();
            }
        });
    }

    private startTheGame(): void {
        this.queue = new GameQueue(this.p1, this.p2);
        this.world = new GameWorld(this.p1, this.p2);
        runGameLoop(this.loop, this.queue, this.world, () => {
            this.endGame();
        });
    }

    private endGame(): void {
        const winner = this.world.getWinner();
        const loser = this.world.getLoser();

        winner.push(createWinnerMessage(), () => winner.close());
        loser.push(createLoserMessage(), () => loser.close());
    }
}

