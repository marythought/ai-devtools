import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import Redis from 'ioredis'
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

// Redis connection options with retry logic
const redisOptions = {
  maxRetriesPerRequest: null, // Disable max retries to prevent crashes
  retryStrategy: (times: number) => {
    if (times > 10) {
      console.error('Redis connection failed after 10 retries')
      return null // Stop retrying
    }
    const delay = Math.min(times * 500, 5000)
    console.log(`Redis retry attempt ${times}, waiting ${delay}ms...`)
    return delay
  },
  lazyConnect: true, // Don't connect immediately
}

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
const redis = new Redis(redisUrl, redisOptions)
const redisSub = new Redis(redisUrl, redisOptions)

// Handle Redis connection errors gracefully
redis.on('error', (err) => {
  console.error('Redis connection error:', err.message)
})
redisSub.on('error', (err) => {
  console.error('Redis subscriber error:', err.message)
})
redis.on('connect', () => {
  console.log('✅ Redis connected')
})
redisSub.on('connect', () => {
  console.log('✅ Redis subscriber connected')
})

app.use(cors())
app.use(express.json())

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// API routes
app.use('/api/sessions', sessionRoutes(prisma, redis))

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
setupWebSocket(io, redis, redisSub, prisma)

// Setup Yjs WebSocket for collaborative editing
setupYjsWebSocket(httpServer)

const PORT = process.env.PORT || 3001

// Connect to Redis and start server
async function startServer() {
  try {
    console.log('Connecting to Redis...')
    await Promise.all([redis.connect(), redisSub.connect()])
    console.log('Redis connections established')
  } catch (err) {
    console.error('Failed to connect to Redis, continuing anyway:', err)
  }

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`📝 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
  })
}

startServer()

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...')
  httpServer.close()
  await prisma.$disconnect()
  await redis.quit()
  await redisSub.quit()
  process.exit(0)
})
