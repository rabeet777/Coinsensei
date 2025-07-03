// src/index.ts
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { initializeOrderBookSocket } from './src/websockets/orderBookSocket'


const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  // 1) Create the raw HTTP server:
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  // 2) Initialize Socket.IO ONCE on this same HTTP server:
  const io = initializeOrderBookSocket(server)
  console.log('✅ Socket.IO server initialized')

// 3) Now that io is ready, start the watcher
import('./src/worker/orderWatcher')
  .then(() => console.log('✅ orderWatcher loaded'))
  .catch(err => console.error('❌ Failed to load orderWatcher:', err))

// 4) (Optional) start your orderMatcher worker as well
import('./src/worker/orderMatcher')
  .then(() => console.log('✅ orderMatcher loaded'))
  .catch(err => console.error('❌ Failed to load orderMatcher:', err))

  // 4) Finally, start listening - use port 3000 (default Next.js port)
  const PORT = parseInt(process.env.PORT || '3000', 10)
  
  // Handle port conflicts gracefully
  server.listen(PORT, () => {
    console.log(`🚀 Next.js + WebSocket server listening on http://localhost:${PORT}`)
    console.log(`📡 Socket.IO endpoint: http://localhost:${PORT}/socket.io/`)
    console.log(`🌐 Access your app at: http://localhost:${PORT}`)
  })

  // Handle server errors
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Please:`)
      console.error(`   1. Stop any other servers running on port ${PORT}`)
      console.error(`   2. Or change the PORT environment variable`)
      console.error(`   3. Try: kill -9 $(lsof -ti:${PORT}) # on Mac/Linux`)
      console.error(`   4. Try: netstat -ano | findstr :${PORT} # on Windows`)
      process.exit(1)
    } else {
      console.error('❌ Server error:', err)
    }
  })
})
