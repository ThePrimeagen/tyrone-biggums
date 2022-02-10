import WebSocket from "ws";
import { createMessage, Message, MessageType } from "../message";

function wait(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
}

async function playTheGame(socket: WebSocket, fireRate: number, cb?: (message: Message) => void) {
    let playing = false;
    socket.on("message", async function(message) {
        const msg = JSON.parse(message.toString()) as Message;
        cb??(msg);
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
    const url = `ws://${addr}:${port}`;
    console.log("url", url);
    const socket = new WebSocket(url);

    socket.on("open", () => {
        playTheGame(socket, fireRate, cb);
    });

    return socket;
}

if (require.main === module) {
    connect(200,
            process.env.ADDR || "events.theprimeagen.tv",
            Number(process.env.PORT) || 69420);

}


