import { applyVelocity, applyVelocityAll, Moveable, Vector2D, Velocity } from "../physics";

test("applies velocity", function() {
    const pos: Vector2D = [1, 1];
    const vel: Vector2D = [0.4, 0.8];

    expect(applyVelocity(pos, vel, 1)).toEqual([1.4, 1.8]);
    expect(applyVelocity(pos, vel, 0.5)).toEqual([1.2, 1.4]);
    expect(applyVelocity(pos, vel, 0.25)).toEqual([1.1, 1.2]);
});

class Item implements Velocity, Moveable {
    constructor(public pos: Vector2D, public vel: Vector2D, public spy: jest.Mock) { }

    applyDelta(pos: Vector2D) {
        this.spy(pos);
    }
}

test("apply vel for all positions", function() {
    const a = new Item([0, 0], [1, 1], jest.fn());
    const b = new Item([0, 0], [2, 2], jest.fn());

    applyVelocityAll([a, b], 1);

    expect(a.spy).toHaveBeenCalled();
    expect(b.spy).toHaveBeenCalled();

    expect(a.spy).toHaveBeenCalledWith([1, 1]);
    expect(b.spy).toHaveBeenCalledWith([2, 2]);
});
