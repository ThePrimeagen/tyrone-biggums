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

export function setupWithRxJS(
  playerSockets: [RxSocket, RxSocket],
  timeout: number = 30000
): Observable<[RxSocket, RxSocket]> {
  const [p1, p2] = playerSockets;
  p1.push(createReadyUpMessage());
  p2.push(createReadyUpMessage());

  return new Observable((subscriber) => {
    let timeoutId = setTimeout(() => {
      subscriber.error(new Error("Timeout"));
    }, timeout);
    subscriber.add(() => clearTimeout(timeoutId));

    let readyCount = 0;
    const checkReady = (msg: Message) => {
      if (msg.type === MessageType.ReadyUp) {
        readyCount++;
        if (readyCount === 2) {
          clearTimeout(timeoutId);
          subscriber.next(playerSockets);
          subscriber.complete();
        }
      }
    };
    subscriber.add(p1.events.subscribe(checkReady));
    subscriber.add(p2.events.subscribe(checkReady));
  });
}
