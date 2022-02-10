import { Bullet, Player } from "../objects";

test("Player", function() {
    jest.useFakeTimers();
    const player = new Player([0, 0], [0, 0], 40);

    expect(player.fire()).toEqual(true);
    expect(player.fire()).toEqual(false);
    jest.advanceTimersByTime(39);
    expect(player.fire()).toEqual(false);
    jest.advanceTimersByTime(1);
    expect(player.fire()).toEqual(true);
    expect(player.fire()).toEqual(false);
});

test("Bullet.createFromPlayer(-1)", function() {
    const player = new Player([0, 0], [-1, 0], 40);
    const bullet = Bullet.createFromPlayer(player, 1);

    expect(bullet.geo.pos).toEqual([-1 - Bullet.BulletWidth, 0]);
});

test("Bullet.createFromPlayer(1)", function() {
    const player = new Player([0, 0], [1, 0], 40);
    const bullet = Bullet.createFromPlayer(player, 1);

    expect(bullet.geo.pos).toEqual([1 + player.geo.width, 0]);
});

