export interface BaseSocket {
    // Events
    push(data: object, cb?: () => void): void;
    close(code?: number): void;
}

