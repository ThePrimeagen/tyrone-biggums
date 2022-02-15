import createServer from "./server";
import createGame from "./game_loop";

if (process.argv.length !== 5) {
    console.error(`
Please provide 3 arguments.
1. style(\"rxjs\" | \"callback\").
2. Address
3. Port
`);
    process.exit(1);
}

const style = process.argv[2];
const addr = process.argv[3];
const port = Number(process.argv[4]);

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

const server = createServer(style, addr, port);
createGame(style, server);

server.on("listening", () => {
    console.log("listening on 42069");
});

