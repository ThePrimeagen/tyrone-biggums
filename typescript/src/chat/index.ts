import { createMessage, Message } from "../message";
import { Server } from "../server";

export class Chat {
    private channels: Map<string, number[]>

    constructor(private server: Server) {
        this.channels = new Map<string, number[]>();
        this.listenToServer(server);
    }

    private listenToServer(server: Server): void {

        server.on("message", (message: Message) => {
            const text = message.msg;
            if (text.startsWith("!join")) {
                this.join(message);
            } else if (text == ":q") {
                this.leaveChannels(message);
            } else {
                this.processMessage(message);
            }
        });

        server.on("close", () => {
            this.channels = new Map<string, number[]>();
        });
    }

    private join(message: Message): void {
        const [_, channelName] = message.msg.split(" ");
        let channel = this.channels.get(channelName);

        if (!channel) {
            channel = [];
            this.channels.set(channelName, channel);
        }

        if (!~channel.indexOf(message.id)) {
            this.leaveChannels(message);
            channel.push(message.id);
            this.server.push(
                createMessage(message, `you have joined channel ${channelName}`));
        } else {
            this.server.push(
                createMessage(message, `you are already apart of ${channelName}`));
        }

    }

    private getChannel(id: number): [number[], number] | undefined {
        for (const [_, channel] of this.channels) {
            const idx = channel.indexOf(id);
            if (~idx) {
                return [channel, idx];
            }
        }
        return undefined;
    }

    private leaveChannels(message: Message): void {
        const channelAndIdx = this.getChannel(message.id);
        if (channelAndIdx) {
            const [channel, idx] = channelAndIdx;
            channel.splice(idx, 1);
        }
    }

    private processMessage(message: Message): void {
        const channelAndIdx = this.getChannel(message.id);
        if (!channelAndIdx) {
            this.server.push(
                createMessage(message, `you have to join a channel first.  message with !join <channel-name> to join`));
            return;
        }

        let [channel] = channelAndIdx;

        this.server.push(...channel.map(id => {
            return createMessage(id, message.msg);
        }));
    }
}


