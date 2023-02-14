import { Context } from "./context"
import { WebSocketServer } from "ws";
import { PreviewServer, printServerRunning } from "./command/preview";
import { publishLiveReloadClientScript } from "./action/publishLiveReloadClientScript";

export type ChangeOperation = 'publish' | 'error' | 'error-fixed'
export type ResourceType = 'html' | 'css' | 'resource'

export interface ChangeOperationEvent {
    id: string,
    operation: ChangeOperation,
    type: ResourceType
}

/** ramps up the WebSocket server for live-reload */
export const startLiveReloadServer = (previewServer: PreviewServer, context: Context) => {
    
    // publish live-reload script so that it will be available
    publishLiveReloadClientScript(context)
    
    // hook WebSocketServer onto express server and register in context
    context.devWebSocketServer = new WebSocketServer({
        server: previewServer.server,
        host: context.config.devOptions.hostname,
        path: '/live-reload',
    })

    // listen for HTTP and WS connections
    previewServer.server.listen(context.config.devOptions?.port, () => 
        printServerRunning('[LiveReloadServer]', context.config))
}

/** inform all connected websocket clients about a change */
export const notifyPageChange = (pageId: string, type: ResourceType, operation: ChangeOperation, context: Context) => {
  context.devWebSocketServer.clients.forEach((ws) => {
    ws.send(
      JSON.stringify({
        operation,
        type,
        id: pageId
      } as ChangeOperationEvent, null, 0),
    )
  })
}
