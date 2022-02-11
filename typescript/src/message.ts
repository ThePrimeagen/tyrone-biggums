import { GameStat } from "./stats";

export enum MessageType {
    ReadyUp,
    Play,
    Fire,
    GameOver,
}

export type Message = {
    type: MessageType,
    msg?: string,
};

export function createMessage(type: MessageType): Message {
    return {
        type
    };
}

export function createReadyUpMessage(): Message {
    return {
        type: MessageType.ReadyUp
    };
}

export function createWinnerMessage(stats: GameStat): Message {
    return {
        type: MessageType.GameOver,
        msg: `winner(${GameStat.activeGames})___${stats.frameBuckets.join(",")}`,
    };
}

export function createLoserMessage(): Message {
    return {
        type: MessageType.GameOver,
        msg: "loser",
    };
}

export function errorGameOver(msg: string): Message {
    return {
        type: MessageType.GameOver,
        msg,
    };
}

