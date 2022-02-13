import createServer from "../server";
import ServerRx from "../server/rxjs-server";
import Server from "../server/callback-server";
import createGame from"../game_loop";

export function createTestServer(style: "rxjs", port: number): Promise<ServerRx>;
export function createTestServer(style: "callback", port: number): Promise<Server>;
export function createTestServer(style: "rxjs" | "callback", port: number): Promise<ServerRx | Server> {
    return new Promise((resolve, reject) => {
        const server = createServer(style, "0.0.0.0", port);
        createGame(style, server);

        server.on("listening", (e: Error) => {
            if (e) {
                reject(e);
            } else {
                resolve(server);
            }
        });
    })
}


