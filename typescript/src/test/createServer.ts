import createServer from "../server";
import ServerRx from "../server/rxjs-server";
import Server from "../server/callback-server";
import createGame from"../game_loop";

export function createTestServer(style: "rxjs", port: number): Promise<ServerRx>;
export function createTestServer(style: "callback", port: number): Promise<Server>;
export function createTestServer(style: "rxjs" | "callback", port: number): Promise<ServerRx | Server> {
    return new Promise((resolve, reject) => {
        const server = createServer(style, port);
        createGame(style, server);

        if (style === "callback") {
            (server as Server).onlisten = (e?: Error) => {
                if (e) {
                    reject(e);
                } else {
                    resolve(server);
                }
            };
        } else {
            const sub = (server as ServerRx).listening.subscribe({
                next: (res) => {
                    sub.unsubscribe();
                    if (res) {
                        resolve(server);
                    }
                },
                error: (e) => {
                    sub.unsubscribe();
                    reject(e);
                }
            });
        }
    })
}


