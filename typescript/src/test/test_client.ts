import WebSocket from "ws";
import us from "microseconds";

function wait(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
}

type ChatMessage = {
    channel_name: string,
    channel_user_count: number,
    from: number,
    msg: string,
}

async function sendMessage(socket: WebSocket) {
    socket.send("!join foo3");
    do {
        await wait(2000);
        socket.send(String(us.now()));
    } while (true);
}

async function connect(addr: string, port: number) {
    const socket = new WebSocket(`ws://${addr}:${port}`);
    let id = -1;

    socket.on("open", () => {
        sendMessage(socket);
    });

    socket.on("message", (message) => {
        const msg = message.toString();
        if (msg.startsWith("!join successful")) {
            const my_id = +msg.split(": ")[1];
            if (isNaN(my_id)) {
                console.error("invalid join command");
                process.exit(1);
            }

            if (id !== -1) {
                console.error("already joined a channel, error!!");
                process.exit(1);
            }

            id = my_id;
            return;
        }

        const data: ChatMessage = JSON.parse(msg);
        const now = us.now();
        const then = +data.msg;
        const diff = now - then;
        console.log(`TIME,${diff}`);
    });
}

export function run(args: string[]) {
    let count = +args[0];
    let addr = args[1] || "0.0.0.0";
    let port = +args[2] || 42069;
    if (isNaN(count)) {
        console.error("You need to provide how many sockets to spawn");
        process.exit(1);
    }

    for (let i = 0; i < count; ++i) {
        connect(addr, port);
    }
}
