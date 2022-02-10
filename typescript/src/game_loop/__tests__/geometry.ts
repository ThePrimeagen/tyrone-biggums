import { AABB, checkForCollisions, Collidable, Geometry } from "../geometry";

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

class TestCollidable<T> implements Collidable<T> {
    constructor(public geo: Geometry<T>) {}
}

test("Test for collisions", function() {
    const a = new TestCollidable<AABB>(AABB.fromWidthHeight(10, 10));
    const b = new TestCollidable<AABB>(AABB.fromWidthHeight(10, 10));
    const c = new TestCollidable<AABB>(AABB.fromWidthHeight(10, 10));
    const d = new TestCollidable<AABB>(AABB.fromWidthHeight(10, 10));

    b.geo.setPosition([11, 11]);
    c.geo.setPosition([22, 22]);
    d.geo.setPosition([35, 35]);

    expect(checkForCollisions<AABB>([a, b, c, d])).toEqual([]);
    b.geo.setPosition([9, 9]);
    expect(checkForCollisions<AABB>([a, b, c, d])).toEqual([[a, b]]);
});
