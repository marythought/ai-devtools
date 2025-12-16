import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient } from '@prisma/client'
import { setupWebSocket } from './websocket/handler.js'
import { setupYjsWebSocket } from './websocket/yjs-server.js'
import sessionRoutes from './routes/sessions.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// API routes
app.use('/api/sessions', sessionRoutes(prisma))

// Serve static files from frontend build (in production)
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist')
  app.use(express.static(frontendPath))

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'))
  })
}

// Setup WebSocket
setupWebSocket(io, prisma)

// Setup Yjs WebSocket for collaborative editing
setupYjsWebSocket(httpServer)

const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📝 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...')
  httpServer.close()
  await prisma.$disconnect()
  process.exit(0)
})
