import createServer from "../server";
import ServerRx from "../server/rxjs-server";
import Server from "../server/callback-server";
import createGame from "../game_loop";
import { once } from "events";

export function createTestServer(
  style: "rxjs",
  port: number
): Promise<ServerRx>;
export function createTestServer(
  style: "callback",
  port: number
): Promise<Server>;
export async function createTestServer(
  style: "rxjs" | "callback",
  port: number
): Promise<ServerRx | Server> {
  const server = createServer(style, port);
  createGame(style, server);

  if (style === "callback") {
    return new Promise((resolve, reject) => {
      server.on("listening", (e: Error) => {
        if (e) {
          reject(e);
        } else {
          resolve(server);
        }
      });
    });
  } else {
    // RxJS server
    await (server as ServerRx).listening;
    return server;
  }
}
