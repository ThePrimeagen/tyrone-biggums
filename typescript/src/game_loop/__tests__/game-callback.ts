import { runGameLoop } from "../game-callback";
import { createMessage, MessageType } from "../../message";
import { createSocket } from "../../mocks/socket";
import { setConfig } from "../config";
import GameLoopTimer from "../game-loop-timer"
import GameQueue from "../game-queue"
import GameWorld from "../game-world"

test("Ensure that the game ends when its suppose to", function() {
    jest.useFakeTimers();

    setConfig({
        winnerFireRate: 40,
        loserFireRate: 75,
    });
    const s1 = createSocket();
    const s2 = createSocket();
    const spy = jest.fn();
    const config = {
        playerStartingX: 150, // 100 width + 0 width would amke this 100 units
                              // apart from each other.  LHS of the player's
                              // starting position has their width bleeding
                              // into the game space.
        bulletSpeed: 1,
    };

    const loop = new GameLoopTimer(100);
    const queue = new GameQueue(s1, s2);
    const world = new GameWorld(s1, s2, config);// , cb: () => void): void {

    // @ts-ignore
    const cb1 = s1.on.mock.calls[0][1];
    // @ts-ignore
    const cb2 = s2.on.mock.calls[0][1];

    runGameLoop(loop, queue, world, spy);
    jest.advanceTimersByTime(10);

    expect(world.bullets.length).toEqual(0);
    jest.advanceTimersByTime(10);
    expect(world.bullets.length).toEqual(0);

    cb1(createMessage(MessageType.Fire));
    expect(world.bullets.length).toEqual(0);
    jest.advanceTimersByTime(10);

    // b1: 10
    // b2: 0
    expect(world.bullets.length).toEqual(1);
    expect(world.bullets[0].geo.pos).toEqual([
        -49 // starting pos
        + 10 // one update
        , 0]);

    cb2(createMessage(MessageType.Fire));
    expect(world.bullets.length).toEqual(1);

    jest.advanceTimersByTime(10);
    expect(world.bullets.length).toEqual(2);
    expect(world.bullets[0].geo.pos).toEqual([
        -29
        , 0]);
    expect(world.bullets[1].geo.pos).toEqual([
        124 // starting position
        - 10 // plus one update
        , 0]);

    let b0pos = -29;
    let b1pos = 114;
    do {
        //~223 - (30 apart + i * 20)
        jest.advanceTimersByTime(10);
        expect(world.bullets.length).toEqual(2);

        b0pos += 10;
        b1pos -= 10;

    } while (Math.abs(b0pos - b1pos) > 45);

    expect(Math.abs(world.bullets[0].geo.pos[0] - world.bullets[1].geo.pos[0])).toEqual(43);

    //Collide on this  update
    jest.advanceTimersByTime(10);
    expect(world.bullets.length).toEqual(0);

    cb1(createMessage(MessageType.Fire));

    let expectedPosition = -39;
    do {
        jest.advanceTimersByTime(10);
        expect(world.bullets.length).toEqual(1);
        expect(world.bullets[0].geo.pos).toEqual([
            expectedPosition
            , 0]);

        expectedPosition += 10;
    } while (expectedPosition < 124)

    expect(world.getWinner()).toEqual(undefined);

    jest.advanceTimersByTime(10);

    expect(world.getWinner()).toEqual(s1);
    expect(world.getLoser()).toEqual(s2);
});
