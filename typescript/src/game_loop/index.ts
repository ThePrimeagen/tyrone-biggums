import EventEmitterBecausePeopleToldMeItWasDogShit from "../event-emitter-because-people-told-me-it-was-dogshit";
import { Server } from "../server";
import { Socket } from "../server/socket";
import { failedToConnect } from "../stats";
import GameLoopTimer from "./game-loop-timer";
import GameQueue from "./game-queue";
import { setupWithCallbacks } from "./game-setup";


export default function gameCreator(server: Server): void {
    server.on("game", ([p1, p2]) => {
        const game = new Game(p1, p2);
    });
}

function getTickRate(): number {
    if (!process.env.TICK_RATE) {
        return 60;
    }
    return +process.env.TICK_RATE || 60;
}

class Game extends EventEmitterBecausePeopleToldMeItWasDogShit {
    private loop: GameLoopTimer;
    private queue!: GameQueue;

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
        this.loop.start((delta: number) => {
            const messages = this.queue.flush();
            if (
        });
    }
}
