import createRxJSGame from "./game_loop/game-rxjs";
import createCallbackJSGame from "./game_loop/game-callback";

const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());

console.log(params);
