export type Vector2D = [number, number];

export interface Moveable {
    pos: Vector2D;
    applyDelta(delta: Vector2D): void;
}

export interface Velocity {
    vel: Vector2D;
}

// PerfNote: Since the velocity is applied immediately, there is no need
// to keep generating new arrays and then gc'ing them.
const cachedVector: Vector2D = [0, 0];
export function applyVelocity(vel: Vector2D, delta: number): Vector2D {
    cachedVector[0] = vel[0] * delta;
    cachedVector[1] = vel[1] * delta;
    return cachedVector;
}

export function applyVelocityAll(items: (Moveable & Velocity)[], delta: number): void {
    items.forEach((item) => {
        item.applyDelta(applyVelocity(item.vel, delta));
    });
}

export function scale(vec: Vector2D, scale: number): Vector2D {
    return [
        vec[0] * scale,
        vec[1] * scale,
    ];
}

