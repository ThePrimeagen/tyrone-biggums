import { Vector2D } from "./physics";

export interface Geometry<T> {
    hasCollision(other: T): boolean;
    setPosition(vec: Vector2D): Geometry<T>;
    applyPosition(delta: Vector2D): Geometry<T>;
}

export class AABB implements Geometry<AABB> {
    private position: Vector2D;
    constructor(x1: number, y1: number, private width: number, private height: number) {
        this.position = [x1, y1];
    }

    hasCollision(other: AABB): boolean {
        const o_x1 = other.position[0];
        const o_x2 = o_x1 + other.width;
        const this_x1 = this.position[0];
        const this_x2 = this_x1 + this.width;

        if (o_x2 < this_x1 || o_x1 > this_x2) {
            return false;
        }

        const o_y1 = other.position[1];
        const o_y2 = o_y1 + other.height;
        const this_y1 = this.position[1];
        const this_y2 = this_y1 + this.height;

        if (o_y2 < this_y1 || o_y1 > this_y2) {
            return false;
        }

        return true;
    }

    setPosition(vec: Vector2D): Geometry<AABB> {
        this.position[0] = vec[0];
        this.position[1] = vec[1];
        return this;
    }

    applyPosition(vec: Vector2D): Geometry<AABB> {
        this.position[0] += vec[0];
        this.position[1] += vec[1];
        return this;
    }

    static fromWidthHeight(width: number, height: number): AABB {
        return new AABB(0, 0, width, height);
    }
}
