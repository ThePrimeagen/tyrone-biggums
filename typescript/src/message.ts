export type Message = {
    id: number,
    msg: string,
};

export function createMessage(id: number, msg: string): Message {
    return { id, msg };
}
