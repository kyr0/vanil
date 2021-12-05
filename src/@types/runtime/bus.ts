export type EventHandler = (event: any) => void

export interface Subscriber {
  topic: string
  handler: EventHandler
}

export type EmitFn = (topic: string, event: any) => void
export type MuteFn = (subscriberId: number) => void
export type ListenFn = (topic: string, handler: EventHandler) => number
export type Subscribers = Array<Subscriber | undefined>

export interface BusApi {
  subscribers: Subscribers
  listen: ListenFn
  mute: MuteFn
  emit: EmitFn
}
