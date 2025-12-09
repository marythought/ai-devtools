import { useEffect, useRef, useState } from 'react'
import ioClient from 'socket.io-client'
import type { User } from '@interview/shared'

type ClientSocket = ReturnType<typeof ioClient>

export function useWebSocket(sessionId: string, username?: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const socketRef = useRef<ClientSocket | null>(null)

  useEffect(() => {
    // Don't connect until we have a username
    if (!username) {
      return
    }

    // Use window.location.origin in production, localhost in development
    const socketUrl = import.meta.env.PROD ? window.location.origin : 'http://localhost:3001'
    const socket = ioClient(socketUrl, {
      transports: ['websocket', 'polling']
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('WebSocket connected:', socket.id, 'username:', username)
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

    socket.on('username-changed', ({ users: updatedUsers }: { users: User[] }) => {
      console.log('Username changed, updating users:', updatedUsers.length)
      setUsers(updatedUsers)
    })

    socket.on('error', (error: any) => {
      console.error('WebSocket error:', error)
    })

    return () => {
      console.log('Cleaning up socket connection')
      socket.disconnect()
    }
  }, [sessionId])

  return {
    socket: socketRef.current,
    isConnected,
    users
  }
}
