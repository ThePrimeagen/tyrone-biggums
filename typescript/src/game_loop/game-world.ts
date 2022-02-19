import { Message, MessageType } from "../message";
import { BaseSocket } from "../server/universal-types";
import getConfig, { setConfig } from "./config";
import createConfig, { GameConfig, PartialConfig } from "./config";
import { checkForCollisions, checkForCollisionsByGroup, collidablePool } from "./geometry";
import { Bullet, Player } from "./objects";
import { applyVelocityAll } from "./physics";
import { Pool } from "./pool";

export interface GameWorld {
    processMessage(socket: BaseSocket, message: Message): void;
    update(delta: number): void;
    on(event: "game-over", cb: (winner: BaseSocket) => void): void;
    off(event: string, cb: (arg?: any) => void): void;
}

let count = 0;
const bulletListPool = new Pool<Bullet[]>(1200, () => []);
export default class GameWorldImpl {
    // for easy inspection
    public p1: Player;
    public p2: Player;

    // If I were to make this faster, I would consider a linked list or ring buffer.
    public p1Bullets: Bullet[];
    public p2Bullets: Bullet[];

    private _done: boolean;
    private winner!: BaseSocket;
    private config: GameConfig;
    private count: number = 0;

    get done(): boolean { return this._done; }

    constructor(private s1: BaseSocket, private s2: BaseSocket, config?: PartialConfig) {
        if (config) {
            setConfig(config);
        }

        this.config = getConfig();

        if (++count % 2 == 0) {
            this.p1 = Player.create(-this.config.playerStartingX, 0, 1, this.config.winnerFireRate);
            this.p2 = Player.create(this.config.playerStartingX, 0, -1, this.config.loserFireRate);
        } else {
            this.p1 = Player.create(-this.config.playerStartingX, 0, 1, this.config.loserFireRate);
            this.p2 = Player.create(this.config.playerStartingX, 0, -1, this.config.winnerFireRate);
        }

        this._done = false;
        this.p1Bullets = bulletListPool.fromCache();
        this.p2Bullets = bulletListPool.fromCache();
    }

    private getPlayer(socket: BaseSocket): Player {
        return this.s1 === socket ? this.p1 : this.p2;
    }

    stop() {
        this._done = true;
        for (let i = 0; i < this.p1Bullets.length; i++) {
            this.p1Bullets[i].cleanUp();
        }
        for (let i = 0; i < this.p2Bullets.length; i++) {
            this.p2Bullets[i].cleanUp();
        }

        // todo: use array pool
        Player.release(this.p1);
        Player.release(this.p2);
        bulletListPool.toCache(this.p1Bullets);
        bulletListPool.toCache(this.p2Bullets);
        this.p1Bullets.length = 0;
        this.p2Bullets.length = 0;
    }

    processMessage(socket: BaseSocket, message: Message) {
        const player = this.getPlayer(socket);
        if (message.type === MessageType.Fire) {
            if (player.fire()) {
                if (this.p1 === player) {
                    this.p1Bullets.push(Bullet.createFromPlayer(player, this.config.bulletSpeed));
                } else {
                    this.p2Bullets.push(Bullet.createFromPlayer(player, this.config.bulletSpeed));
                }
            }
        }
    }

    update(delta: number): void {
        if (++this.count === 300) {
            if (this.p1Bullets.length === 0 && this.p2Bullets.length === 0) {
                // nothing has been fired... what?
                this.stop();
                this.winner = this.s1;
                console.error("stopping game due to no bullets fired");
            }
        }

        applyVelocityAll(this.p1Bullets, delta);
        applyVelocityAll(this.p2Bullets, delta);
    }

    collisions(): void {
        // 1. Remove all bullets
        let collided = checkForCollisions(this.p1Bullets, this.p2Bullets);
        for (let i = 0; i < collided.length; i += 2) {
            this.removeBullet(this.p1Bullets, collided[i] as Bullet);
            this.removeBullet(this.p2Bullets, collided[i + 1] as Bullet);
        }

        collided.length = 0;
        collidablePool.toCache(collided as []);

        // 2. check for collision with players
        const collidedWithPlayer1 = checkForCollisionsByGroup(this.p1, this.p2Bullets);
        if (collidedWithPlayer1) {
            this._done = true;
            this.winner = this.s2;
        }

        const collidedWithPlayer2 = checkForCollisionsByGroup(this.p2, this.p1Bullets);
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

    private removeBullet(bulletList: Bullet[], b: Bullet): void {
        b.cleanUp();
        bulletList.splice(bulletList.indexOf(b), 1);
    }
}

