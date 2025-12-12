import type { Server, Socket } from 'socket.io'
import type Redis from 'ioredis'
import type { PrismaClient } from '@prisma/client'

interface User {
  id: string
  username: string
  joinedAt: number
}

export function setupWebSocket(
  io: Server,
  redis: Redis,
  redisSub: Redis,
  prisma: PrismaClient
) {
  // Subscribe to Redis pub/sub for multi-instance support
  redisSub.subscribe('code-changes')
  redisSub.on('message', (channel, message) => {
    if (channel === 'code-changes') {
      const { sessionId, data } = JSON.parse(message)
      io.to(sessionId).emit('code-change', data)
    }
  })

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id)

    socket.on('join-session', async (sessionId: string, username?: string) => {
      try {
        socket.join(sessionId)

        const user: User = {
          id: socket.id,
          username: username || `User-${socket.id.slice(0, 4)}`,
          joinedAt: Date.now()
        }

        // Store user info in Redis
        await redis.hset(
          `session:${sessionId}:users`,
          socket.id,
          JSON.stringify(user)
        )

        // Get all users in session and verify they're still connected
        const usersData = await redis.hgetall(`session:${sessionId}:users`)
        const connectedSockets = await io.in(sessionId).fetchSockets()
        const connectedSocketIds = new Set(connectedSockets.map(s => s.id))

        // Always include the current socket (might not be in fetchSockets yet due to race condition)
        connectedSocketIds.add(socket.id)

        // Clean up disconnected users from Redis
        const users: User[] = []
        for (const [socketId, userData] of Object.entries(usersData)) {
          if (connectedSocketIds.has(socketId)) {
            users.push(JSON.parse(userData))
          } else {
            // Remove stale user from Redis
            await redis.hdel(`session:${sessionId}:users`, socketId)
          }
        }

        // Notify all users
        io.to(sessionId).emit('user-joined', { userId: socket.id, username, users })

        // Send current session state to joining user
        const session = await prisma.interviewSession.findUnique({
          where: { id: sessionId }
        })

        if (session) {
          socket.emit('session-state', session)
        }

        console.log(`User ${socket.id} joined session ${sessionId}`)
      } catch (error) {
        console.error('Error joining session:', error)
        socket.emit('error', { message: 'Failed to join session' })
      }
    })

    socket.on('cursor-change', async (data) => {
      const { sessionId, position, selection } = data
      socket.to(sessionId).emit('remote-cursor', {
        userId: socket.id,
        position,
        selection
      })
    })

    socket.on('language-change', async (data) => {
      try {
        const { sessionId, language } = data
        await prisma.interviewSession.update({
          where: { id: sessionId },
          data: { language }
        })
        io.to(sessionId).emit('language-changed', { language })
        console.log(`Language changed to ${language} in session ${sessionId}`)
      } catch (error) {
        console.error('Error changing language:', error)
      }
    })

    socket.on('username-change', async (data) => {
      try {
        const { sessionId, username } = data

        // Update user in Redis
        const userJson = await redis.hget(`session:${sessionId}:users`, socket.id)
        if (userJson) {
          const user = JSON.parse(userJson)
          user.username = username
          await redis.hset(
            `session:${sessionId}:users`,
            socket.id,
            JSON.stringify(user)
          )

          // Get all users and notify everyone
          const usersData = await redis.hgetall(`session:${sessionId}:users`)
          const users = Object.values(usersData).map(u => JSON.parse(u))

          io.to(sessionId).emit('username-changed', { userId: socket.id, username, users })
          console.log(`Username changed to ${username} in session ${sessionId}`)
        }
      } catch (error) {
        console.error('Error changing username:', error)
      }
    })

    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id)

      // Find all rooms user was in
      const rooms = Array.from(socket.rooms).filter(r => r !== socket.id)

      for (const sessionId of rooms) {
        try {
          await redis.hdel(`session:${sessionId}:users`, socket.id)
          const usersData = await redis.hgetall(`session:${sessionId}:users`)
          const users = Object.values(usersData).map(u => JSON.parse(u))

          io.to(sessionId).emit('user-left', { userId: socket.id, users })
          console.log(`User ${socket.id} left session ${sessionId}`)
        } catch (error) {
          console.error('Error handling disconnect:', error)
        }
      }
    })
  })
}
