export type Vector2D = [number, number];

export function applyVelocity(pos: Vector2D, vel: Vector2D, delta: number): Vector2D {
    return [
        pos[0] + vel[0] * delta,
        pos[1] + vel[1] * delta,
    ];
}
