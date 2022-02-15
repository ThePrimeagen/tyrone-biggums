import { mergeMap, Observable, Subscriber, tap } from "rxjs";
import { onErrorResumeNext } from "rxjs/operators";
import { createLoserMessage, createMessage, createWinnerMessage, errorGameOver, MessageType } from "../message";
import { Server } from "../server/rxjs-server";
import { Socket } from "../server/rxjs-socket";
import { BaseSocket } from "../server/universal-types";
import { GameStat } from "../stats";
import { GameLoopRxJS } from "./game-loop-timer";
import { GameQueue, GameQueueRxJSImpl } from "./game-queue";
import { setupWithRxJS } from "./game-setup";
import GameWorld from "./game-world";

function getTickRate(): number {
    if (!process.env.TICK_RATE) {
        return 60;
    }
    return +process.env.TICK_RATE || 60;
}

export type GameResults = [GameStat, BaseSocket, BaseSocket];
export function runRxJSLoop([s1, s2]: [Socket, Socket]): Observable<GameResults> {
    return Observable.create((observer: Subscriber<GameResults>) => {
        const stats = new GameStat();
        const queue = new GameQueueRxJSImpl(s1, s2);
        const world = new GameWorld(s1, s2);
        const loop = new GameLoopRxJS(getTickRate());

        function close(other: Socket) {
            if (world.done) {
                return;
            }

            loop.stop();
            other.push(errorGameOver("The other player disconnected"));
            observer.error(new Error("Disconnected"));
        }

        s1.events.subscribe({
            complete: () => {
                close(s2);
            }
        });

        s2.events.subscribe({
            complete: () => {
                close(s1);
            }
        });

        loop.start().pipe(
            tap((delta: number) => {
                stats.addDelta(delta);
                // 1. process messages
                queue.flush().forEach(m => world.processMessage(m.from, m.message));

                // 2. update all positions
                world.update(delta);

                // 3. process collisions
                world.collisions();

                // 4. check for ending conditions
                if (world.done) {
                    loop.stop();
                    observer.complete();
                }
            })
        ).subscribe({
            complete: () => {
                const gameResult: GameResults = [stats, world.getWinner(), world.getLoser()];
                observer.next(gameResult);
                observer.complete();
            }
        });
    })
}

function empty<T>(): Observable<T> {
    return Observable.create((observer: Subscriber<T>) => {
        observer.complete();
    })
}

export default function gameCreator(server: Server) {
    server.on().pipe(
        mergeMap(sockets => setupWithRxJS(sockets)),
        tap(([s1, s2]) => {
            s1.push(createMessage(MessageType.Play));
            s2.push(createMessage(MessageType.Play));
        }),
        mergeMap(([s1, s2]) => {
            return runRxJSLoop([s1, s2]).pipe(
                tap({
                    next: ([stats, winner, loser]) => {
                        winner.push(createWinnerMessage(stats), () => winner.close());
                        loser.push(createLoserMessage(), () => loser.close());
                        GameStat.activeGames--;
                    },
                    error: (_) => {
                        GameStat.activeGames--;
                    }
                }),
                onErrorResumeNext(empty<GameResults>())
            );
        }),
    ).subscribe();
}
