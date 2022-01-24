import { Chat } from "./chat";
import Server from "./server";
import { run } from "./test/test_client";

const args = process.argv.slice(2);
if (args[0] == "test") {
    run(args.slice(1));
} else {
    const server = new Server("0.0.0.0", 42069);

    server.on("listening", () => {
        console.log("listening on 42069");
    });

    new Chat(server);
}

