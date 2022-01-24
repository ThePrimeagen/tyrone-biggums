import WebSocket from "ws";

function wait(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
}

async function sendMessage(socket: WebSocket) {
    socket.send("!join foo3");
    do {
        await wait(2000);
        socket.send("hello, server 3");
    } while (true);
}

async function connect() {
    const socket = new WebSocket("ws://0.0.0.0:42069");

    socket.on("open", () => {
        console.log("open");
        sendMessage(socket);
    });

    socket.on("message", (msg) => {
        console.log("message from server", msg.toString());
    });
}

export function run(args: string[]) {
    let count = +args[0];
    if (isNaN(count)) {
        console.error("You need to provide how many sockets to spawn");
        process.exit(1);
    }

    for (let i = 0; i < count; ++i) {
        connect();
    }
}
