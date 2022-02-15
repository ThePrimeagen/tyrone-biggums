import { errorGameOver } from "../../message";
import { createTestServer } from "../createServer";
import { connect } from "../game_player";

function wait(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
}

const DISCONNECT_PORT = 42069;
/*
test("player disconnects", async () => {
    const server = await createTestServer("callback", DISCONNECT_PORT);
    const spy1 = jest.fn();
    const spy2 = jest.fn();

    const s1 = connect(50, "0.0.0.0", DISCONNECT_PORT, spy1); // loser first round

    await wait(1000);
    expect(spy1).toHaveBeenCalledTimes(0);

    const s2 = connect(50, "0.0.0.0", DISCONNECT_PORT, spy2);
    await wait(1000);

     // ready play.
    expect(spy1).toHaveBeenCalledTimes(2);
    expect(spy2).toHaveBeenCalledTimes(2);

    s1.close();
    await wait(1000);

    expect(spy2).toHaveBeenCalledTimes(3);
    expect(spy2).toHaveBeenLastCalledWith(errorGameOver("The other player disconnected"));

    s2.close();
    server.close();
});
*/

test("player disconnects (rxjs)", async () => {
    const server = await createTestServer("rxjs", DISCONNECT_PORT);
    const spy1 = jest.fn((arg) => {
        console.log("spy1", arg);
    });
    const spy2 = jest.fn((arg) => {
        console.log("spy2", arg);
    });

    const s1 = connect(50, "0.0.0.0", DISCONNECT_PORT, spy1); // loser first round

    await wait(1000);
    expect(spy1).toHaveBeenCalledTimes(0);

    const s2 = connect(50, "0.0.0.0", DISCONNECT_PORT, spy2);
    await wait(1000);

     // ready play.
    expect(spy1).toHaveBeenCalledTimes(2);
    expect(spy2).toHaveBeenCalledTimes(2);

    s1.close();
    await wait(1000);

    expect(spy2).toHaveBeenCalledTimes(3);
    expect(spy2).toHaveBeenLastCalledWith(errorGameOver("The other player disconnected"));

    s2.close();
    server.close();
});
