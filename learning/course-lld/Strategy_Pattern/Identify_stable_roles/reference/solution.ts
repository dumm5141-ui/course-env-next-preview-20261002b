export class NotificationRouter {
  channels = new Map();
  register(name, channel) {
    this.channels.set(name, channel);
  }
  send(name, message) {
    const channel = this.channels.get(name);
    if (!channel) throw new Error("Unknown channel");
    return channel.send(message);
  }
}
