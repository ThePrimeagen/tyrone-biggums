export type Message = {
    msg: string,
};

export function createMessage(msg: string): Message {
    return {
        msg
    };
}

