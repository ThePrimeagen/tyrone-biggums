import Server from "./callback-server";
import ServerRx from "./rxjs-server";

export function createServer(style: "rxjs", addr: string, port: number): ServerRx;
export function createServer(style: "callback", addr: string, port: number): Server;
export default function createServer(style: "rxjs" | "callback", addr: string, port: number): ServerRx | Server {
    if (style === "rxjs") {
        return new ServerRx(addr, port);
    }
    return new Server(addr, port);
}

