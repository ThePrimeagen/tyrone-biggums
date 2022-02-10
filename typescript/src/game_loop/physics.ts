export type Vector2D = [number, number];

export interface Moveable {
    pos: Vector2D;
    applyDelta(delta: Vector2D): void;
}

export interface Velocity {
    vel: Vector2D;
}

export function applyVelocity(vel: Vector2D, delta: number): Vector2D {
    return [
        vel[0] * delta,
        vel[1] * delta,
    ];
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

