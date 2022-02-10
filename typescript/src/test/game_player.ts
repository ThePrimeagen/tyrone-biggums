import WebSocket from "ws";
import { createMessage, Message, MessageType } from "../message";

function wait(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
}

async function playTheGame(socket: WebSocket, fireRate: number, cb?: (message: Message) => void) {
    let playing = false;
    socket.on("message", async function(message) {
        const msg = JSON.parse(message.toString()) as Message;
        if (cb) {
            cb(msg);
        }
        switch (msg.type) {
            case MessageType.ReadyUp:
                socket.send(JSON.stringify(createMessage(MessageType.ReadyUp)))
                break;

            case MessageType.Play:
                playing = true;
                do {
                    socket.send(JSON.stringify(createMessage(MessageType.Fire)));
                    await wait(fireRate);
                } while (playing);

                break;
        }
    });
}

export function connect(fireRate: number, addr: string, port: number, cb?: (message: Message) => void): WebSocket {
    const url = `ws://0.0.0.0:${port}`;
    console.log("url", url);
    const socket = new WebSocket(url);

    socket.on("open", () => {
        playTheGame(socket, fireRate, cb);
    });

    return socket;
}

function repeatConnect(addr: string, port: number) {
    connect(200,
            addr || "events.theprimeagen.tv",
            port || 69420, (msg) => {
                if (msg.type === MessageType.GameOver) {
                    console.log("Game Over: Restarting");
                    repeatConnect(addr, port);
                }
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
            await wait(100);
            repeatConnect(addr, port);
        }
    }

    run();
}
