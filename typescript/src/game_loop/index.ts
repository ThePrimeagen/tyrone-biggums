import Server from "../server/callback-server";
import ServerRx from "../server/rxjs-server";
import serverListenerGameCreator from "./game-callback";
import rxjsSucksServer from "./game-rxjs";

export function connectServerToGame(style: "rxjs", server: ServerRx): void;
export function connectServerToGame(style: "callback", server: Server): void;
export default function connectServerToGame(style: "rxjs" | "callback", server: ServerRx | Server): void {
    if (style === "rxjs") {
        rxjsSucksServer(server as ServerRx); // nit: why doesn't this auto pick up type with overload interface
    } else {
        serverListenerGameCreator(server as Server); // nit: why doesn't this auto pick up type with overload interface
    }
}
