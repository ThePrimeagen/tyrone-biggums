import WebSocket from "ws";
import us from "microseconds";

let chat_idx = 0;
let chat = [
    "foo0",
    "foo1",
    "foo2",
    "foo3",
    "foo4",
    "foo5",
    "foo6",
    "foo7",
    "foo8",
    "foo9",
];
let initial_waits = [
    0,
    50,
    100,
    150,
    200,
    250,
    300,
    350,
    400,
    450,
    500,
    550,
    600,
    650,
    700,
    750,
    800,
    850,
    900,
    950,
    1000,
    1050,
    1100,
    1150,
    1200,
    1250,
    1300,
    1350,
    1400,
    1450,
    1500,
    1550,
    1600,
    1650,
    1700,
    1750,
    1800,
    1850,
    1900,
    1950,
    2000,
];

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
    let idx = chat_idx++;
    socket.send(`!join ${chat[idx % chat.length]}`);
    await wait(initial_waits[idx % initial_waits.length]);
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
        console.log("MESSAGE", msg);
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
        if (data.from != id) {
            return;
        }

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
