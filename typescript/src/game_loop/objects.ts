import { AABB, Collidable, Geometry } from "./geometry";
import { Moveable, scale, Vector2D, Velocity } from "./physics";

export class Player implements Collidable<AABB> {
    public geo: AABB;
    private lastFire: number;

    constructor(pos: Vector2D, public dir: Vector2D, private fireRate: number) {
        this.lastFire = 0;
        this.geo = AABB.fromWidthHeight(100, 100).setPosition(pos) as AABB; // this Geometry<AABB> sucks..
    }

    fire(): boolean {
        const now = Date.now();
        if (this.fireRate > now - this.lastFire) {
            return false;
        }

        this.lastFire = now;
        return true;
    }
}

export class Bullet implements Collidable<AABB>, Moveable, Velocity {
    public geo: AABB;

    get pos(): Vector2D {
        // @ts-ignore no its not possibly undefined.  The constructor ensures
        // that it does exist
        return this.geo.pos;
    }

    constructor(pos: Vector2D, public vel: Vector2D, geo?: AABB) {
        this.geo = geo || Bullet.standardBulletGeometry(pos);
    }

    applyDelta(delta: Vector2D): void {
        this.geo.applyDelta(delta);
    }

    static standardBulletGeometry(pos: Vector2D): AABB {
        const aabb = AABB.fromWidthHeight(Bullet.BulletWidth, 3);
        aabb.setPosition(pos);

        return aabb;
    }

    static createFromPlayer(player: Player, speed: number) {
        if (player.dir[0] === 1) {

            return new Bullet([
                player.geo.pos[0] + player.geo.width + 1,
                0
            ], scale(player.dir, speed));
        }

        return new Bullet([
            player.geo.pos[0] - Bullet.BulletWidth - 1,
            0
        ], scale(player.dir, speed));
    }

    static BulletWidth = 25;
}
