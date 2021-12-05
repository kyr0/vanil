export type GenericEventHandlerFn = (eventHandlerName: string, event: Event) => void
export type EventRegistryMap = {
  [eventHanderName: string]: Function
  __warnNonInteractive: (eventHandlerName: string) => void
}
export type AddEventHandlerFn = (eventHandlerName: string, handlerFn: (e: Event) => void) => void

export interface EventApi {
  e: GenericEventHandlerFn
  events: EventRegistryMap
  on: AddEventHandlerFn
}
