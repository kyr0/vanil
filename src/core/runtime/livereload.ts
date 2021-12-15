// BEWARE: This file is only baked in, when mode === `development`
const connect = () => {
  console.log(`[hmr] trying to (re-)connect to: ${__VANIL_LIVE_RELOAD_URL}...`)
  const liveReloadSocket = new WebSocket(__VANIL_LIVE_RELOAD_URL)

  liveReloadSocket.onmessage = (event: any) => {
    const eventData = JSON.parse(event.data)

    if (eventData.operation === 'transform') {
      eventData.paths.forEach((path: string) => {
        let pathMatch = location.pathname === path

        console.log('HMR location.pathname', location.pathname, 'vs', path)

        if (location.pathname.endsWith('/') && (eventData.path === '/index.html' || eventData.path === '/index')) {
          pathMatch = true
        }

        if (!eventData.path || pathMatch) {
          document.location.reload()
        }
      })
    }
  }

  liveReloadSocket.onclose = () => {
    setTimeout(connect, 1000)
  }
}
connect()
