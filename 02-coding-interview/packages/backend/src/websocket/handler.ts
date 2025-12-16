import type { Server, Socket } from 'socket.io'
import type { PrismaClient } from '@prisma/client'

interface User {
  id: string
  username: string
  joinedAt: number
}

// In-memory storage for session users (single instance deployment)
const sessionUsers = new Map<string, Map<string, User>>()

export function setupWebSocket(
  io: Server,
  prisma: PrismaClient
) {

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

        // Store user info in memory
        if (!sessionUsers.has(sessionId)) {
          sessionUsers.set(sessionId, new Map())
        }
        sessionUsers.get(sessionId)!.set(socket.id, user)

        // Get all users in session
        const users = Array.from(sessionUsers.get(sessionId)!.values())

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

        // Update user in memory
        const sessionUsersMap = sessionUsers.get(sessionId)
        if (sessionUsersMap && sessionUsersMap.has(socket.id)) {
          const user = sessionUsersMap.get(socket.id)!
          user.username = username
          sessionUsersMap.set(socket.id, user)

          // Get all users and notify everyone
          const users = Array.from(sessionUsersMap.values())

          io.to(sessionId).emit('username-changed', { userId: socket.id, username, users })
          console.log(`Username changed to ${username} in session ${sessionId}`)
        }
      } catch (error) {
        console.error('Error changing username:', error)
      }
    })

    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id)

      // Find and remove user from all sessions they were in
      for (const [sessionId, usersMap] of sessionUsers.entries()) {
        if (usersMap.has(socket.id)) {
          usersMap.delete(socket.id)
          const users = Array.from(usersMap.values())

          io.to(sessionId).emit('user-left', { userId: socket.id, users })
          console.log(`User ${socket.id} left session ${sessionId}`)

          // Clean up empty sessions
          if (usersMap.size === 0) {
            sessionUsers.delete(sessionId)
          }
        }
      }
    })
  })
}
