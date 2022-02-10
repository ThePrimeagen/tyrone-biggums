export type Vector2D = [number, number];

export interface Moveable {
    pos: Vector2D;
    applyDelta(delta: Vector2D): void;
}

export interface Velocity {
    vel: Vector2D;
}

export function applyVelocity(pos: Vector2D, vel: Vector2D, delta: number): Vector2D {
    return [
        pos[0] + vel[0] * delta,
        pos[1] + vel[1] * delta,
    ];
}

export function applyVelocityAll(items: (Moveable & Velocity)[], delta: number): void {
    items.forEach((item) => {
        item.applyDelta(applyVelocity(item.pos, item.vel, delta));
    });
}

