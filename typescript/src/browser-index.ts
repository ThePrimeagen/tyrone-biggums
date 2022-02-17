import createRxJSGame from "./game_loop/game-rxjs";
import createCallbackJSGame from "./game_loop/game-callback";
import { CallbackSocket, RxSocket } from "./server/universal-types";

const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());

console.log(params);

function createSocket(style: "rxjs"): RxSocket;
function createSocket(style: "callback"): CallbackSocket;
//@ts-ignore
function createSocket(style: "rxjs" | "callback"): CallbackSocket | RxSocket {
}
