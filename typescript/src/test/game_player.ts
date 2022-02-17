import WebSocket from "ws";
import { createMessage, Message, MessageType } from "../message";

function wait(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
}

function parseAndReportWinnerStats(winnerData: string) {
    const parts = winnerData.split("___");
    const activeGames = +parts[0].split("(")[1].split(")")[0];
    const buckets = parts[1].split(",").map(x => +x);

    console.log("Results", activeGames, JSON.stringify(buckets));
}

let countSend = 0;
function sendMessage(socket: WebSocket) {
    countSend++;
    if (countSend % 10000 === 0) {
        console.log("Sent 10000 Messages");
    }
    socket.send(fireMessage);
}

const fireMessage = JSON.stringify(createMessage(MessageType.Fire));
async function playTheGame(socket: WebSocket, fireRate: number, cb: (msg: Message) => void = () => {}) {
    let playing = false;
    socket.on("message", async function(message) {
        const msg = JSON.parse(message.toString()) as Message;
        cb(msg);
        switch (msg.type) {
            case MessageType.ReadyUp:
                socket.send(JSON.stringify(createMessage(MessageType.ReadyUp)))
                break;

            case MessageType.Play:
                playing = true;
                do {
                    sendMessage(socket);
                    await wait(fireRate);
                } while (playing);

                break;

            case MessageType.GameOver:
                if (msg.msg?.startsWith("winner")) {
                    parseAndReportWinnerStats(msg.msg);
                }
                playing = false;
                socket.close();
        }
    });
}

export function connect(fireRate: number, addr: string, port: number, cb: (msg: Message) => void = () => {}): WebSocket {
    const url = `ws://${addr}:${port}`;
    const socket = new WebSocket(url);

    socket.on("open", () => {
        playTheGame(socket, fireRate, cb);
    });

    return socket;
}

let _id = 0;
let MAX = process.env.MAX || 2;
function repeatConnect(addr: string, port: number, count: number = 0) {
    if (count === MAX) {
        return;
    }

    const id = ++_id;
    const socket = connect(200,
            addr || "events.theprimeagen.tv",
            port || 42069);

    socket.on("close", () => {
        repeatConnect(addr, port, count + 1);
    });

    socket.on("error", (e) => {
        repeatConnect(addr, port, count + 1);
    });
}

if (require.main === module) {
    const count = +process.argv[2];
    const addr = process.argv[3];
    const port = +process.argv[4];

    async function run() {
        function wait(ms: number): Promise<void> {
            return new Promise(res => setTimeout(res, ms));
        }
        for (let i = 0; i < count; ++i) {
            await wait(50);
            repeatConnect(addr, port);
        }
    }

    run();
}
