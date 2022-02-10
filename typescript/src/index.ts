import Server from "./server";
import createGame from "./game_loop";

const server = new Server("0.0.0.0", 42069);
createGame(server);

server.on("listening", () => {
    console.log("listening on 42069");
});

