export interface BaseSocket {
    // Events
    push(data: object, cb?: () => void): void;
}

