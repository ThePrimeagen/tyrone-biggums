import { mergeMap, Observable, Subscriber, Subscription, tap } from "rxjs";
import { onErrorResumeNext } from "rxjs/operators";
import {
  createLoserMessage,
  createMessage,
  createWinnerMessage,
  errorGameOver,
  MessageType,
} from "../message";
import { Server } from "../server/rxjs-server";
import { BaseSocket, RxSocket } from "../server/universal-types";
import { GameStat } from "../stats";
import { GameLoopRxJS, getRxJSGameLoop } from "./game-loop-timer";
import { GameQueueRxJSImpl } from "./game-queue";
import { setupWithRxJS } from "./game-setup";
import GameWorld from "./game-world";

function getTickRate(): number {
  if (!process.env.TICK_RATE) {
    return 60;
  }
  return +process.env.TICK_RATE || 60;
}

export type GameResults = [GameStat, BaseSocket, BaseSocket];
export function runRxJSLoop([s1, s2]: [
  RxSocket,
  RxSocket
]): Observable<GameResults> {
  return new Observable((subscriber) => {
    const stats = new GameStat();
    const queue = new GameQueueRxJSImpl(s1, s2);
    subscriber.add(() => queue.stop());

    const world = new GameWorld(s1, s2);
    subscriber.add(() => world.stop());

    function close(other: RxSocket) {
      if (world.done) {
        return;
      }
      other.push(errorGameOver("The other player disconnected"));
      subscriber.error(new Error("Disconnected"));
    }

    subscriber.add(
      s1.events.subscribe({
        complete: () => {
          close(s2);
        },
      })
    );

    subscriber.add(
      s2.events.subscribe({
        complete: () => {
          close(s1);
        },
      })
    );

    subscriber.add(
      getRxJSGameLoop(getTickRate()).subscribe((delta) => {
        stats.addDelta(delta);

        // 1. process messages
        queue.flush().forEach((m) => world.processMessage(m.from, m.message));

        // 2. update all positions
        world.update(delta);

        // 3. process collisions
        world.collisions();

        if (world.done) {
          const gameResult: GameResults = [
            stats,
            world.getWinner(),
            world.getLoser(),
          ];
          subscriber.next(gameResult);
          subscriber.complete();
        }
      })
    );
  });
}

function empty<T>(): Observable<T> {
  return Observable.create((observer: Subscriber<T>) => {
    observer.complete();
  });
}

export default function gameCreator(server: Server) {
  server
    .on()
    .pipe(
      mergeMap((sockets) => setupWithRxJS(sockets)),
      tap(([s1, s2]) => {
        s1.push(createMessage(MessageType.Play));
        s2.push(createMessage(MessageType.Play));
      }),
      mergeMap(([s1, s2]) => {
        GameStat.activeGames++;
        return runRxJSLoop([s1, s2]).pipe(
          tap({
            next: ([stats, winner, loser]) => {
              winner.push(createWinnerMessage(stats), () => winner.close());
              loser.push(createLoserMessage(), () => loser.close());
              GameStat.activeGames--;
            },
            error: (_) => {
              GameStat.activeGames--;
            },
          }),
          onErrorResumeNext(empty<GameResults>())
        );
      })
    )
    .subscribe();
}
