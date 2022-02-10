import Server from "../server";
import createGame from"../game_loop";

export function createServer(port: number): Promise<Server> {
    return new Promise((resolve, reject) => {
        const server = new Server("0.0.0.0", port);
        createGame(server);

        server.on("listening", (e: Error) => {
            if (e) {
                reject(e);
            } else {
                resolve(server);
            }
        });
    })
}


