import { useEffect, useRef, useState } from 'react'
import ioClient from 'socket.io-client'
import type { User } from '@interview/shared'

type ClientSocket = ReturnType<typeof ioClient>

export function useWebSocket(sessionId: string, username?: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const socketRef = useRef<ClientSocket | null>(null)

  useEffect(() => {
    const socket = ioClient('http://localhost:3001', {
      transports: ['websocket', 'polling']
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('WebSocket connected:', socket.id)
      setIsConnected(true)
      socket.emit('join-session', sessionId, username)
    })

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
    })

    socket.on('user-joined', ({ users: updatedUsers }: { users: User[] }) => {
      console.log('User joined, total users:', updatedUsers.length)
      setUsers(updatedUsers)
    })

    socket.on('user-left', ({ users: updatedUsers }: { users: User[] }) => {
      console.log('User left, total users:', updatedUsers.length)
      setUsers(updatedUsers)
    })

    socket.on('language-changed', ({ language }: { language: string }) => {
      console.log('Language changed to:', language)
    })

    socket.on('error', (error: any) => {
      console.error('WebSocket error:', error)
    })

    return () => {
      socket.disconnect()
    }
  }, [sessionId, username])

  return {
    socket: socketRef.current,
    isConnected,
    users
  }
}
