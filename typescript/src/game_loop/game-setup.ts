import { createReadyUpMessage, Message, MessageType } from "../message";
import { Socket } from "../server/socket";
import { Socket as SocketRxJS } from "../server/rxjs-socket";
import { filter, map, merge, Observable, take, timer, zip } from "rxjs";

type Callback = (e?: Error) => void;

function readyUp(socket: Socket, idx: number, done: [boolean, boolean], timeout: number, callback: Callback) {
    function onMsg(msg: Message) {
        if (msg.type === MessageType.ReadyUp) {
            done[idx] = true;
            socket.off("message", onMsg);

            if (done[0] && done[1]) {
                callback();
            }
        }
    };

    socket.on("message", onMsg);
}


export function setupWithCallbacks(p1: Socket, p2: Socket, callback: Callback, timeout: number = 30000): void  {
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
    }, timeout)

    p1.push(createReadyUpMessage());
    p2.push(createReadyUpMessage());
}


export function setupWithRxJS([p1, p2]: [SocketRxJS, SocketRxJS], timeout: number = 30000): Observable<[SocketRxJS, SocketRxJS]>  {
    p1.push(createReadyUpMessage());
    p2.push(createReadyUpMessage());

    return merge(
        zip(
            p1.events.pipe(
                filter((msg: Message) => msg.type === MessageType.ReadyUp)
            ),
            p2.events.pipe(
                filter((msg: Message) => msg.type === MessageType.ReadyUp)
            ),
        ),
        timer(timeout).pipe(
            map(() => new Error("Timeout"))
        )
    ).pipe(
        take(1),
        map((x) => {
            console.log("setupWithRxJS#(anon)", x);// __AUTO_GENERATED_PRINTF__
            if (x instanceof Error) {
                throw x;
            }
            return [p1, p2];
        })
    );
}
