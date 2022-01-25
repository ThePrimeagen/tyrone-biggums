
export default class User {
    private received: number;
    private sent: number;

    constructor(private id: number) {
        this.received = 0;
        this.sent = 0;
    }

    inc_sent(): void {
        this.sent++;
    }
    inc_recv(): void {
        this.received++;
    }
}
