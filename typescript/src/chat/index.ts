import { createMessage, Message } from "../message";
import { Server } from "../server";
import { Socket } from "../server/socket";

export class Chat {
    private channels: Map<string, number[]>
    private lookup_channel: Map<number, string>

    constructor(private server: Server) {
        this.channels = new Map<string, number[]>();
        this.lookup_channel = new Map<number, string>();

        this.listenToServer(server);
    }

    private listenToServer(server: Server): void {

        server.on("message", (message: Message) => {
            const text = message.msg;
            if (text.startsWith("!join")) {
                this.leaveChannels(message);
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

        server.on("socket-close", (socket: Socket) => {
            this.leaveChannels({id: socket.id, msg: ""});
        });
    }

    private join(message: Message): void {
        const [_, channelName] = message.msg.split(" ");
        let channel = this.channels.get(channelName);

        if (!channel) {
            channel = [];
            this.channels.set(channelName, channel);
        }
        this.lookup_channel.set(message.id, channelName);

        channel.push(message.id);
        this.server.push(
            createMessage(message, `you have joined channel ${channelName}`));

    }

    private leaveChannels(message: Message): void {
        const channel_name = this.lookup_channel.get(message.id);
        if (!channel_name) {
            return;
        }
        this.lookup_channel.delete(message.id);

        const channel = this.channels.get(channel_name);
        if (!channel) {
            return
        }

        const index = channel.indexOf(message.id);
        channel.splice(index, 1);
    }

    private processMessage(message: Message): void {
        const channel_name = this.lookup_channel.get(message.id)
        const channel = this.channels.get(channel_name || "");

        if (!channel) {
            this.server.push(
                createMessage(message, {
                    error: true,
                    msg: `you have to join a channel first.  message with !join <channel-name> to join`
                }));
            return;
        }

        this.server.push(...channel.map(id => {
            return createMessage(id, {
                channel_name,
                channel_user_count: channel.length,
                from: id,
                msg: message.msg
            });
        }));
    }
}


