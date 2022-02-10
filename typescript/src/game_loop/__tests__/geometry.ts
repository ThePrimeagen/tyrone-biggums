import { AABB } from "../geometry";

test("AABB intersections", function() {
    const a = AABB.fromWidthHeight(10, 10);
    const b = AABB.fromWidthHeight(10, 10);

    expect(a.hasCollision(b)).toEqual(true);

    b.applyDelta([1, 0]);
    expect(a.hasCollision(b)).toEqual(true);

    b.applyDelta([8.99, 0]);
    expect(a.hasCollision(b)).toEqual(true);

    b.applyDelta([0.02, 0]);
    expect(a.hasCollision(b)).toEqual(false);

    b.applyDelta([-0.02, 0]);
    expect(a.hasCollision(b)).toEqual(true);

    b.applyDelta([0, 1]);
    expect(a.hasCollision(b)).toEqual(true);

    b.applyDelta([0, 8.99]);
    expect(a.hasCollision(b)).toEqual(true);

    b.applyDelta([0, 0.02]);
    expect(a.hasCollision(b)).toEqual(false);

    a.setPosition([0, 0]);
    b.setPosition([0, 0]);

    b.applyDelta([-1, 0]);
    expect(a.hasCollision(b)).toEqual(true);

    b.applyDelta([-8.99, 0]);
    expect(a.hasCollision(b)).toEqual(true);

    b.applyDelta([-0.02, 0]);
    expect(a.hasCollision(b)).toEqual(false);

    b.applyDelta([0.02, 0]);
    expect(a.hasCollision(b)).toEqual(true);

    b.applyDelta([0, -1]);
    expect(a.hasCollision(b)).toEqual(true);
-
    b.applyDelta([0, -8.99]);
    expect(a.hasCollision(b)).toEqual(true);

    b.applyDelta([0, -0.02]);
    expect(a.hasCollision(b)).toEqual(false);
});

