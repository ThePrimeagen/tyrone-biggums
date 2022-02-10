import EventEmitterBecausePeopleToldMeItWasDogShit from "../event-emitter-because-people-told-me-it-was-dogshit";
import { Message, MessageType } from "../message";
import { BaseSocket } from "../server/universal-types";
import { Bullet, Player } from "./objects";

export interface GameWorld {
    processMessage(socket: BaseSocket, message: Message): void;
    update(delta: number): void;
    on(event: "game-over", cb: (winner: BaseSocket) => void): void;
    off(event: string, cb: (arg?: any) => void): void;
}

let count = 0;
export default class GameWorldImpl extends EventEmitterBecausePeopleToldMeItWasDogShit {
    private p1: Player;
    private p2: Player;

    // If I were to make this faster, I would consider a linked list or ring buffer.
    private bullets: Bullet[];

    constructor(private s1: BaseSocket, private s2: BaseSocket) {
        super();

        if (++count % 2 == 0) {
            this.p1 = new Player([-150, 0], [1, 0], 40);
            this.p2 = new Player([150, 0], [-1, 0], 75);
        } else {
            this.p1 = new Player([-150, 0], [1, 0], 75);
            this.p2 = new Player([150, 0], [-1, 0], 40);
        }

        this.bullets = [];
    }

    private getPlayer(socket: BaseSocket): Player {
        return this.s1 === socket ? this.p1 : this.p2;
    }

    processMessage(socket: BaseSocket, message: Message) {
        const player = this.getPlayer(socket);
        if (message.type === MessageType.Fire) {
            if (player.fire()) {
                this.bullets.push(Bullet.createFromPlayer(player));
            }
        }
    }

    update(delta: number): void {
    }
}

