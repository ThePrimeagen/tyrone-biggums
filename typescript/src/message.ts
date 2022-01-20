export type Message = {
    id: number,
    msg: string,
};

export function createMessage(idOrMessage: number | Message, msg: string): Message {
    if (typeof idOrMessage === "number") {
        return { id: idOrMessage, msg };
    }
    return {
        id: idOrMessage.id,
        msg
    };
}

