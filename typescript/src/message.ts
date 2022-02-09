export enum MessageType {
    ReadyUp,
    Play,
}

export type Message = {
    type: MessageType,
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

