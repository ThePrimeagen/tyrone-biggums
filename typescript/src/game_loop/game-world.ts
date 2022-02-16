import EventEmitterBecausePeopleToldMeItWasDogShit from "../event-emitter-because-people-told-me-it-was-dogshit";
import { Message, MessageType } from "../message";
import { BaseSocket } from "../server/universal-types";
import createConfig, { GameConfig, PartialConfig } from "./config";
import { checkForCollisions, checkForCollisionsByGroup } from "./geometry";
import { Bullet, Player } from "./objects";
import { applyVelocityAll } from "./physics";

export interface GameWorld {
    processMessage(socket: BaseSocket, message: Message): void;
    update(delta: number): void;
    on(event: "game-over", cb: (winner: BaseSocket) => void): void;
    off(event: string, cb: (arg?: any) => void): void;
}

let count = 0;
export default class GameWorldImpl extends EventEmitterBecausePeopleToldMeItWasDogShit {
    // for easy inspection
    public p1: Player;
    public p2: Player;

    // If I were to make this faster, I would consider a linked list or ring buffer.
    public bullets: Bullet[];

    private _done: boolean;
    private winner!: BaseSocket;
    private config: GameConfig;

    get done(): boolean { return this._done; }

    constructor(private s1: BaseSocket, private s2: BaseSocket, config?: PartialConfig) {
        super();
        this.config = createConfig(config);

        if (++count % 2 == 0) {
            this.p1 = new Player(
                [-this.config.playerStartingX, 0],
                [1, 0],
                this.config.winnerFireRate);
            this.p2 = new Player(
                [this.config.playerStartingX, 0],
                [-1, 0],
                this.config.loserFireRate);
        } else {
            this.p1 = new Player(
                [-this.config.playerStartingX, 0],
                [1, 0],
                this.config.loserFireRate);
            this.p2 = new Player(
                [this.config.playerStartingX, 0],
                [-1, 0],
                this.config.winnerFireRate);
        }

        this._done = false;
        this.bullets = [];
    }

    private getPlayer(socket: BaseSocket): Player {
        return this.s1 === socket ? this.p1 : this.p2;
    }

    stop() {
        this._done = true;
        this.bullets.forEach(b => b.cleanUp());
    }

    processMessage(socket: BaseSocket, message: Message) {
        const player = this.getPlayer(socket);
        if (message.type === MessageType.Fire) {
            if (player.fire()) {
                this.bullets.push(Bullet.createFromPlayer(player, this.config.bulletSpeed));
            }
        }
    }

    update(delta: number): void {
        applyVelocityAll(this.bullets, delta);
    }

    collisions(): void {
        // 1. Remove all bullets
        checkForCollisions(this.bullets).forEach(([b1, b2]) => {
            this.removeBullet(b1 as Bullet);
            this.removeBullet(b2 as Bullet);
        });

        // 2. check for collision with players
        const collidedWithPlayer1 = checkForCollisionsByGroup(this.p1, this.bullets);
        if (collidedWithPlayer1) {
            this._done = true;
            this.winner = this.s2;
        }

        const collidedWithPlayer2 = checkForCollisionsByGroup(this.p2, this.bullets);
        if (collidedWithPlayer2) {
            this._done = true;
            this.winner = this.s1;
        }
    }

    getWinner(): BaseSocket {
        return this.winner;
    }

    getLoser(): BaseSocket {
        return this.winner === this.s1 ? this.s2 : this.s1;
    }

    private removeBullet(b: Bullet): void {
        b.cleanUp();
        this.bullets.splice(this.bullets.indexOf(b), 1);
    }
}

