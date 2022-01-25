import { createMessage, Message } from "../message";
import { Server } from "../server";
import { Socket } from "../server/socket";
import User from "./user";

type MessageContent = {
    inc: number;
    msg: string;
    ts: number;
}

export class Chat {
    private channels: Map<string, number[]>
    private lookup_channel: Map<number, string>
    private users: Map<number, User>

    constructor(private server: Server) {
        this.channels = new Map<string, number[]>();
        this.lookup_channel = new Map<number, string>();
        this.users = new Map<number, User>();

        this.listenToServer(server);
    }

    private listenToServer(server: Server): void {

        server.on("message", (message: Message) => {
            const text = message.msg;
            if (!this.users.has(message.id)) {
                this.users.set(message.id, new User(message.id));
            }

            const user = this.users.get(message.id);
            if (user) {
                user.inc_sent();
            }

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
            createMessage(message, `!join successful: ${message.id}`));

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
        const messageContent: MessageContent = JSON.parse(message.msg);
        messageContent.inc++;

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
            const user = this.users.get(message.id);
            if (user) {
                user.inc_recv();
            }
            return createMessage(id, {
                channel_name,
                channel_user_count: channel.length,
                from: id,
                msg: messageContent, // TODO: I hate this name
            });
        }));
    }
}


