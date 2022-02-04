import WebSocket from "ws";

enum MessageType {
    ReadyUp = 0,
}

type Message = {
    type: MessageType
}

async function playTheGame(socket: WebSocket) {
    socket.on("message", function(message) {
        const msg = JSON.parse(message.toString()) as Message;
        console.log(msg, msg.type, MessageType.ReadyUp, msg.type === MessageType.ReadyUp);
        switch (msg.type) {
            case MessageType.ReadyUp:
                socket.send(JSON.stringify({
                    ready: true,
                    // TODO: Id?
                }))
                break;

            default:
                console.error("Should never get here");
                process.exit(1);
        }
    });
}

async function connect() {
    const url = `ws://0.0.0.0:42069`;
    console.log("url", url);
    const socket = new WebSocket(url);

    socket.on("open", () => {
        playTheGame(socket);
    });
}

connect();


