
export interface EventApi {
    e: (eventHandlerName: string, event: Event) => void
    events: {
        [eventHanderName: string]: Function,
        __warnNonInteractive: (eventHandlerName: string) => void
    },
    on: (eventHandlerName: string, handlerFn: (e: Event) => void) => void
}