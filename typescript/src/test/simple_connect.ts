import WebSocket from "ws";
async function connect() {
    const url = `ws://0.0.0.0:42069`;
    console.log("url", url);
    const socket = new WebSocket(url);

    socket.on("open", () => {
        console.log("open");
    });
}

connect();

