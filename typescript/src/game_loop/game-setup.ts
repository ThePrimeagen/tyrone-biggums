import { createReadyUpMessage, Message, MessageType } from "../message";
import { filter, map, merge, Observable, take, timer, zip } from "rxjs";
import { CallbackSocket, RxSocket } from "../server/universal-types";
import { noop } from "../server/socket";

type Callback = (e?: Error) => void;

function readyUp(
  socket: CallbackSocket,
  idx: number,
  done: [boolean, boolean],
  timeout: number,
  callback: Callback
) {
  function onMsg(msg: Message) {
    if (msg.type === MessageType.ReadyUp) {
      done[idx] = true;
      socket.onmessage = noop;

      if (done[0] && done[1]) {
        callback();
      }
    }
  }

  socket.onmessage = onMsg;
}

export function setupWithCallbacks(
  p1: CallbackSocket,
  p2: CallbackSocket,
  callback: Callback,
  timeout: number = 30000
): void {
  const done: [boolean, boolean] = [false, false];

  let finished = false;
  function finishedCB(error?: Error) {
    if (finished) {
      return;
    }
    finished = true;
    callback(error);
  }

  readyUp(p1, 0, done, timeout, finishedCB);
  readyUp(p2, 1, done, timeout, finishedCB);

  setTimeout(() => {
    finishedCB(new Error("Timeout"));
  }, timeout);

  p1.push(createReadyUpMessage());
  p2.push(createReadyUpMessage());
}
