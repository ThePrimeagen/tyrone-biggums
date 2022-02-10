import { applyVelocity, Vector2D } from "../physics";

test("applies velocity", function() {
    const pos: Vector2D = [1, 1];
    const vel: Vector2D = [0.4, 0.8];

    expect(applyVelocity(pos, vel, 1)).toEqual([1.4, 1.8]);
    expect(applyVelocity(pos, vel, 0.5)).toEqual([1.2, 1.4]);
    expect(applyVelocity(pos, vel, 0.25)).toEqual([1.1, 1.2]);
});
