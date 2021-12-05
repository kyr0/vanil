/** event handler registration object */
Vanil.events = {
  __warnNonInteractive: (eventName: string) =>
    console.warn(`Vanil.events.${eventName} not registered. Element remains non-interactive.`),
}

Vanil.e = (eventHandlerName: string, event: Event) => {
  if (Vanil.events[eventHandlerName]) {
    Vanil.events[eventHandlerName](event)
  } else {
    Vanil.events.__warnNonInteractive(eventHandlerName)
  }
}

Vanil.on = function (eventHandlerName: string, handlerFn: (e: Event) => void) {
  Vanil.events[eventHandlerName] = handlerFn
}
