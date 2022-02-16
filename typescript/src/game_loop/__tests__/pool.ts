import ObjectPool from "../pool";

test("Pool", function() {
    let id = 68;
    const testPool = new ObjectPool<number>(2, () => ++id);

    const o1 = testPool.pop();
    const o2 = testPool.pop();
    const o3 = testPool.pop();

    expect(o1).toEqual(69);
    expect(o2).toEqual(70);
    expect(o3).toEqual(71);
    expect(testPool.capacity()).toEqual(2);

    testPool.push(o3);
    testPool.push(o2);
    testPool.push(o1);
    expect(testPool.capacity()).toEqual(4);

    const o4 = testPool.pop();
    const o5 = testPool.pop();
    const o6 = testPool.pop();
    const o7 = testPool.pop();

    expect(o4).toEqual(71);
    expect(o5).toEqual(70);
    expect(o6).toEqual(69);
    expect(o7).toEqual(72);
    expect(testPool.capacity()).toEqual(4);

});

