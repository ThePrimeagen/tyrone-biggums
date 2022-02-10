import { AABB, Collidable, Geometry } from "./geometry";
import { Moveable, Vector2D, Velocity } from "./physics";

export class Player implements Collidable<AABB> {
    public geo: Geometry<AABB>;
    private lastFire: number;

    constructor(pos: Vector2D, private fireRate: number) {
        this.lastFire = 0;
        this.geo = AABB.fromWidthHeight(10, 10).setPosition(pos);
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
    get pos(): Vector2D {
        return this.geo.pos;
    }
    constructor(public vel: Vector2D, public geo: AABB) { }

    applyDelta(delta: Vector2D): void {
        this.geo.applyDelta(delta);
    }
}
