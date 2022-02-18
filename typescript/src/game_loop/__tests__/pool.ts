import ObjectPool, { Attachable } from "../pool";

class Item implements Attachable<null> {
    constructor(public value: number) {
    }
    attach() {}
    detach() {}
}

test("Pool", function() {
    let id = 68;
    const testPool = new ObjectPool<null, Item>(2, () => new Item(++id));

    const o1 = testPool.pop();
    const o2 = testPool.pop();
    const o3 = testPool.pop();

    expect(o1.value).toEqual(69);
    expect(o2.value).toEqual(70);
    expect(o3.value).toEqual(71);
    expect(testPool.capacity()).toEqual(2);

    testPool.push(o3);
    testPool.push(o2);
    testPool.push(o1);
    expect(testPool.capacity()).toEqual(4);

    const o4 = testPool.pop();
    const o5 = testPool.pop();
    const o6 = testPool.pop();
    const o7 = testPool.pop();

    expect(o4.value).toEqual(71);
    expect(o5.value).toEqual(70);
    expect(o6.value).toEqual(69);
    expect(o7.value).toEqual(72);
    expect(testPool.capacity()).toEqual(4);

});

