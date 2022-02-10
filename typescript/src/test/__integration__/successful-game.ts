import { setConfig } from "../../game_loop/config";
import { createLoserMessage, createWinnerMessage, MessageType } from "../../message";
import { createServer } from "../createServer";
import { connect } from "../game_player";

function wait(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
}

const SUCCESS_PORT = 42070;
test("player disconnects", async () => {
    const server = await createServer(SUCCESS_PORT);
    setConfig({
        winnerFireRate: 40,
        loserFireRate: 75,
    });

    async function play(count: number) {
        const spy1 = jest.fn();
        const spy2 = jest.fn();
        connect(50, "0.0.0.0", SUCCESS_PORT, spy1); // loser first round

        await wait(1000);
        expect(spy1).toHaveBeenCalledTimes(0);
        expect(spy2).toHaveBeenCalledTimes(0);

        connect(50, "0.0.0.0", SUCCESS_PORT, spy2);
        await wait(1000);

        // ready play.
        expect(spy1).toHaveBeenCalledTimes(2);
        expect(spy2).toHaveBeenCalledTimes(2);

        // game should be over within 10 seconds
        do {
            await wait(1000);
        } while (spy1.mock.calls.length < 3 && spy2.mock.calls.length < 3);

        expect(spy1).toHaveBeenCalledTimes(3);
        expect(spy2).toHaveBeenCalledTimes(3);

        if (count === 1) {
            expect(spy1.mock.calls[2][0]).toEqual(createLoserMessage());
            expect(spy2.mock.calls[2][0].type).toEqual(MessageType.GameOver);
            expect(spy2.mock.calls[2][0].msg.slice(0, "winner".length)).toEqual("winner");
        } else if (count === 2) {
            expect(spy1.mock.calls[2][0].type).toEqual(MessageType.GameOver);
            expect(spy1.mock.calls[2][0].msg.slice(0, "winner".length)).toEqual("winner");
            expect(spy2.mock.calls[2][0]).toEqual(createLoserMessage());
        } else {
            expect(true).toEqual(false);
        }
    }

    await play(1);
    await play(2);
    server.close();
}, 30000);

