import { AABB, Geometry } from "./geometry";
import { Vector2D } from "./physics";


export class Player {
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

