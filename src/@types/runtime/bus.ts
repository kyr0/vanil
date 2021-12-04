export type EventHandler = (event: any) => void

export interface Subscriber {
  topic: string
  handler: EventHandler
}

export interface BusApi {
  subscribers: Array<Subscriber | undefined>
  listen(topic: string, handler: EventHandler): number
  mute(subscriberId: number): void
  emit(topic: string, event: any): void
}
