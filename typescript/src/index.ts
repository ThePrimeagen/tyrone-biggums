import createServer from "./server";
import createGame from "./game_loop";

const style = process.argv[2] || process.env.SERVER_STYLE;
const port = Number(process.argv[4] || process.env.SERVER_PORT);

if (isNaN(port)) {
    console.error("The third argument (port) was not a number");
    process.exit(1);
}

if (port < 0 || port > 65535) {
    console.error("The third argument (port) was smaller than 0 or greater than 65535");
    process.exit(1);
}

if (style !== "rxjs" && style !== "callback") {
    console.error("Expected first argument to be either 'rxjs' or 'callback'.");
    process.exit(1);
}

const server = createServer(style, port);
createGame(style, server);

server.on("listening", () => {
    console.log("listening on 42069");
});

