// this file is only published to the dist folder when in dev
import type { ChangeOperationEvent } from "../core/live-reload"

/** time interval, the websocket connection is retried to connect */
const liveReloadClientReconnectIntervalMs = 1000

/** debounce time to prevent stacking up reloads */
const reloadDebounceTimeMs = 50

/** prints a message to the console that is prefixed by [LiveReloadClient] */
const printLiveReloadClientStatus = (message: string) => `[LiveReloadClient] ${message}`

const CACHE_KEY = '_$live-reload'

interface PageData {
  url: string
}

interface PageUrlMap {
  [pageId: string]: PageData
}

const readCache = (): PageUrlMap => 
  JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}')

const writeCache = (pageUrlMap: PageUrlMap = {}) => 
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(pageUrlMap))

/** deals with a page.pubish event by reloading the document when curernt path is affected */
const handlePagePublishEvent = (eventData: ChangeOperationEvent) => {

  // in case live reload is active on _error_report page and the 
  // page that errored out and brought us here is re-published
  // successfully, let's redirect to the original page
  const pageIdParam = _$CTX.url.searchParams.get('pageId')
  const isErrorPagePointingToErrorOfPageThatJustPublished =
    document.location.href.endsWith(getErrorPageUrl(pageIdParam))

  if (isErrorPagePointingToErrorOfPageThatJustPublished && readCache()[pageIdParam]) {
    document.location.href = readCache()[pageIdParam].url
    return
  }

  // if the page we're working on has been re-published or 
  // if there is an order to reload every connected live reload client, lets reload
  const pathMatch = eventData.id === '*' || _$CTX.id === eventData.id
  
  //console.log('eventData', eventData, 'cache', readCache())

  if (pathMatch) {
    reload()
  }
}

const getErrorPageUrl = (pageId: string) => {
  // TODO: support base subDir
  return `${_$CTX.url.origin}/_error_report${_$CTX.urlFormat === 'file' ? '.html' : ''}?pageId=${pageId}`
}

/** deals with a page.error event by redirecting to _error_report.html in SSG mode or reload in SSR/ISR */
const handlePagePublishError  = (eventData: ChangeOperationEvent) => {

  console.log('handlePagePublishError', eventData)

  // redirect to error page
  if (_$CTX.type === 'ssg') {
    //alert('redirecting to error in pageId ' + _$CTX.id)
    document.location.href = getErrorPageUrl(_$CTX.id)
  }
}

/** connects/re-conencts to the LiveReloadServer */
const connect = () => {
  const liveReloadUrl = `ws://${_$CTX.url.host}/live-reload`

  printLiveReloadClientStatus(`trying to (re-)connect to: ${liveReloadUrl}...`)
  const liveReloadSocket = new WebSocket(liveReloadUrl)

  liveReloadSocket.onopen = () => {
    printLiveReloadClientStatus('connected')
  }

  liveReloadSocket.onmessage = (event) => {
    const eventData = JSON.parse(event.data) as ChangeOperationEvent

    console.log('onmessage', event, eventData)
    // TODO: handle file changes such as CSS change, image change in smarter ways than reloading
    switch (eventData.type) {
      case 'html':
        switch(eventData.operation) {
          case 'publish':
            handlePagePublishEvent(eventData)
            break
          case 'error':
            handlePagePublishError(eventData)
        }
        break
    }
  }

  liveReloadSocket.onclose = () => {
    printLiveReloadClientStatus('disconnected')
    setTimeout(connect, liveReloadClientReconnectIntervalMs)
  }
}

/** callc the function (fn) once in a timeframe of (n) ms */
const debounce = (fn: Function, ms: number) => {
  let timeout: NodeJS.Timeout;

  return function () {
    const delegate = () => fn.apply(
      // @ts-ignore
      this, arguments);

    clearTimeout(timeout);
    timeout = setTimeout(delegate, ms);
  }
}

/** debounced site reload to make sure shortly repeated changes don't stack up */
const reload = debounce(() => {
  printLiveReloadClientStatus('reloading...')
  document.location.reload()
}, reloadDebounceTimeMs)

// update session cache
writeCache({
  ...readCache(),
  [_$CTX.id]: {
    url: document.location.href
  }
})

connect()