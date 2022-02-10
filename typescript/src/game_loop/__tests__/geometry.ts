import { AABB } from "../geometry";

test("AABB constructs correctly", function() {
    const aabb = AABB.fromWidthHeight(15, 25);
    expect(aabb.getPosition()).toEqual([0, 0]);
});

test("AABB intersections", function() {
    const a = AABB.fromWidthHeight(10, 10);
    const b = AABB.fromWidthHeight(10, 10);

    expect(a.hasCollision(b)).toEqual(true);

    b.applyPosition([1, 0]);
    expect(a.hasCollision(b)).toEqual(true);

    b.applyPosition([8.99, 0]);
    expect(a.hasCollision(b)).toEqual(true);

    b.applyPosition([0.02, 0]);
    expect(a.hasCollision(b)).toEqual(false);

    b.applyPosition([-0.02, 0]);
    expect(a.hasCollision(b)).toEqual(true);

    b.applyPosition([0, 1]);
    expect(a.hasCollision(b)).toEqual(true);

    b.applyPosition([0, 8.99]);
    expect(a.hasCollision(b)).toEqual(true);

    b.applyPosition([0, 0.02]);
    expect(a.hasCollision(b)).toEqual(false);

    a.setPosition(0, 0);
    b.setPosition(0, 0);

    b.applyPosition([-1, 0]);
    expect(a.hasCollision(b)).toEqual(true);

    b.applyPosition([-8.99, 0]);
    expect(a.hasCollision(b)).toEqual(true);

    b.applyPosition([-0.02, 0]);
    expect(a.hasCollision(b)).toEqual(false);

    b.applyPosition([0.02, 0]);
    expect(a.hasCollision(b)).toEqual(true);

    b.applyPosition([0, -1]);
    expect(a.hasCollision(b)).toEqual(true);
-
    b.applyPosition([0, -8.99]);
    expect(a.hasCollision(b)).toEqual(true);

    b.applyPosition([0, -0.02]);
    expect(a.hasCollision(b)).toEqual(false);

});

