import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import Redis from 'ioredis'
import { PrismaClient } from '@prisma/client'
import { setupWebSocket } from './websocket/handler.js'
import { setupYjsWebSocket } from './websocket/yjs-server.js'
import sessionRoutes from './routes/sessions.js'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

const prisma = new PrismaClient()
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
const redisSub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

app.use(cors())
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// API routes
app.use('/api/sessions', sessionRoutes(prisma, redis))

// Setup WebSocket
setupWebSocket(io, redis, redisSub, prisma)

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
  await redis.quit()
  await redisSub.quit()
  process.exit(0)
})
