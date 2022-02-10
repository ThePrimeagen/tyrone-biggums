import { Player } from "../objects";

test("Player", function() {
    jest.useFakeTimers();
    const player = new Player([0, 0], 40);

    expect(player.fire()).toEqual(true);
    expect(player.fire()).toEqual(false);
    jest.advanceTimersByTime(39);
    expect(player.fire()).toEqual(false);
    jest.advanceTimersByTime(1);
    expect(player.fire()).toEqual(true);
    expect(player.fire()).toEqual(false);
});

