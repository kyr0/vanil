import { EventHandler } from '../../@types/runtime/bus'

Vanil.subscribers = []

/** subscribe to a specific topic on the bus; returns index */
Vanil.listen = (topic: string, handler: EventHandler) =>
  Vanil.subscribers.push({
    topic,
    handler,
  }) - 1

/** unsubscribe by index */
Vanil.mute = (subscriberIndex: number) => (Vanil.subscribers[subscriberIndex] = undefined)

/** publish/broadcast an event object on a topic to all listeners */
Vanil.emit = (topic: string, event: any) => {
  for (let i = 0; i < Vanil.subscribers.length; i++) {
    if (Vanil.subscribers[i] && Vanil.subscribers[i]!.topic === topic) {
      Vanil.subscribers[i]!.handler(event)
    }
  }
}
