// src/websockets/orderBookSocket.ts

import { Server } from 'socket.io'
import { Server as HTTPServer } from 'http'

/**
 * We keep a module‐scope variable for our Socket.IO instance.
 * It starts as null and is set once initializeOrderBookSocket is called.
 */
let io: Server | null = null

/**
 * Call this exactly once—after you have created your HTTP server and before you start listening.
 * For example, in your main index.ts:
 *
 *    const server = http.createServer(app)
 *    initializeOrderBookSocket(server)
 *    server.listen(PORT, ...)
 *
 * That ensures `io` is non‐null by the time any worker or service calls emitOrderBook().
 */
export function initializeOrderBookSocket(server: HTTPServer) {
  if (io) {
    // If already initialized, return the existing instance
    return io
  }
console.log('*** INITIALIZING SOCKET.IO SERVER ***')
  // Create a new Socket.IO server on top of the provided HTTP server
  io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',      // Adjust in production to your front‐end origin
      methods: ['GET', 'POST'],
    },
  })

  // Log connections and disconnections
  io.on('connection', (socket) => {
    console.log('⚡️ WebSocket client connected:', socket.id)

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket client disconnected:', socket.id)
    })
  })

  return io
}

/**
 * Emits the current order‐book snapshot to all connected clients.
 * If initializeOrderBookSocket() has not been called yet, this will warn and return.
 */
export function emitOrderBook(orderBook: any) {
  if (!io) {
    console.warn('⚠ emitOrderBook called before initializeOrderBookSocket()')
    return
  }

  io.emit('orderBookUpdate', orderBook)
}
