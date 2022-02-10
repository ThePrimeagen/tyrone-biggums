import EventEmitterBecausePeopleToldMeItWasDogShit from "../event-emitter-because-people-told-me-it-was-dogshit";
import { Message } from "../message";
import { BaseSocket } from "../server/universal-types";

export interface GameWorld {
    processMessage(socket: BaseSocket, message: Message): void;
    on(event: "game-over", cb: (winner: BaseSocket) => void): void;
    off(event: string, cb: (arg?: any) => void): void;
}


class GameWorldImpl extends EventEmitterBecausePeopleToldMeItWasDogShit {
    constructor(private p1: BaseSocket, private p2: BaseSocket) {
        super();
    }

    processMessage(socket: BaseSocket, message: Message) {
    }

    update(delta: number): void {
    }
}

