import { mergeMap, Observable } from "rxjs";
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
import { getRxJSGameLoop } from "./game-loop-timer";
import { GameQueueRxJSImpl } from "./game-queue";
import { setupWithRxJS } from "./game-setup";
import GameWorld from "./game-world";

function getTickRate(): number {
  if (!process.env.TICK_RATE) {
    return 60;
  }
  return +process.env.TICK_RATE || 60;
}
export interface GameResults {
  readonly stats: GameStat;
  readonly winner: BaseSocket;
  readonly loser: BaseSocket;
  readonly disconnected: boolean;
}

class GameResultsImpl implements GameResults {
  constructor(
    public readonly stats: GameStat,
    public readonly winner: BaseSocket,
    public readonly loser: BaseSocket,
    public readonly disconnected: boolean
  ) {}
}

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
      subscriber.next(new GameResultsImpl(stats, s1, s2, true));
      subscriber.complete();
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
        const messageEnvolopes = queue.flush();
        for (let i = 0; i < messageEnvolopes.length; i++) {
          const m = messageEnvolopes[i];
          world.processMessage(m.from, m.message);
        }

        // 2. update all positions
        world.update(delta);

        // 3. process collisions
        world.collisions();

        if (world.done) {
          const gameResult = new GameResultsImpl(
            stats,
            world.getWinner(),
            world.getLoser(),
            false
          );
          subscriber.next(gameResult);
          subscriber.complete();
        }
      })
    );
  });
}

export default function gameCreator(server: Server) {
  server
    .on()
    .pipe(
      mergeMap((sockets) =>
        setupWithRxJS(sockets).pipe(
          mergeMap(([s1, s2]) => {
            s1.push(createMessage(MessageType.Play));
            s2.push(createMessage(MessageType.Play));
            GameStat.activeGames++;
            return runRxJSLoop([s1, s2]);
          })
        )
      )
    )
    .subscribe({
      next: (results) => {
        if (!results.disconnected) {
          const { stats, winner, loser } = results;
          winner.push(createWinnerMessage(stats), () => winner.close());
          loser.push(createLoserMessage(), () => loser.close());
        }
        GameStat.activeGames--;
      },
    });
}
