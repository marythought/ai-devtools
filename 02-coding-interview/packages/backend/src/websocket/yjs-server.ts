import { Server as HTTPServer } from 'http'
import { setupWSConnection } from 'y-websocket/bin/utils'
import { WebSocketServer } from 'ws'

export function setupYjsWebSocket(httpServer: HTTPServer) {
  // Create WebSocket server for Yjs on the same HTTP server
  const wss = new WebSocketServer({ noServer: true })

  wss.on('connection', setupWSConnection)

  // Upgrade HTTP connections to WebSocket for Yjs
  httpServer.on('upgrade', (request, socket, head) => {
    // Check if this is a Yjs WebSocket request
    // Yjs client connects without specific path, Socket.io uses /socket.io
    const { pathname } = new URL(request.url || '', `http://${request.headers.host}`)

    if (pathname !== '/socket.io/') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request)
      })
    }
  })

  console.log('📡 Yjs WebSocket server initialized')

  return wss
}
