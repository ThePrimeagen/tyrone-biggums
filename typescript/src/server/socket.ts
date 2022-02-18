import WebSocket from "ws";
import { Attachable } from "../game_loop/pool";
import { Message } from "../message";
import { BaseSocket, CallbackSocket } from "./universal-types";

export function noop() {};
let _id = 0;
export default class SocketImpl implements CallbackSocket, BaseSocket, Attachable<WebSocket> {

    public onmessage: (message: Message) => void = noop;
    public onclose: () => void = noop;
    public onerror: (error: Error) => void = noop;

    private boundMessage: (msg: WebSocket.MessageEvent) => void;
    private boundClose: () => void;
    private boundError: (e: Error) => void;
    private ws!: WebSocket;
    private id: number;

    constructor() {
        this.id = _id++;
        this.boundMessage = this._onmessage.bind(this);
        this.boundClose = this._onclose.bind(this);
        this.boundError = this._onerror.bind(this);
    }

    attach(ws: WebSocket) {
        this.ws = ws;
        this.ws.onmessage = this.boundMessage;

        this.ws.onclose = this.boundClose;
        // @ts-ignore  -- BECAUSE I AM THE BOSS
        this.ws.onerror = this.boundError;
    }

    detach(): void {
        // TODO: Is this really..... the way to do it?
        // @ts-ignore
        this.ws.onmessage = undefined;
        // @ts-ignore
        this.ws.onclose = undefined;
        // @ts-ignore
        this.ws.onerror = undefined;

        this.onmessage = this.onclose = this.onerror = noop;
    }

    close(code?: number): void {
        this.ws.close(code);
    }

    push(data: object, cb?: () => void): void {
        this.ws.send(JSON.stringify(data), cb);
    }

    clean(): void {
        this.onclose = this.onerror = this.onmessage = noop;
    }

    private _onmessage(msg: WebSocket.MessageEvent): void {

        const message = JSON.parse(msg.data.toString()) as Message;
        this.onmessage(message);
    }

    private _onclose(): void {
        this.onclose();
    }

    private _onerror(e: Error): void {
        this.onerror(e);
    }
}

