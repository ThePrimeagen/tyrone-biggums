import Server from "./callback-server";
import ServerRx from "./rxjs-server";

export function createServer(style: "rxjs", port: number): ServerRx;
export function createServer(style: "callback", port: number): Server;
export default function createServer(style: "rxjs" | "callback", port: number): ServerRx | Server {
    if (style === "rxjs") {
        return new ServerRx(port);
    }
    return new Server(port);
}

