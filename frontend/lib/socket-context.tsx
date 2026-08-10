"use client"

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthContext } from '@/app/providers/auth-provider'
import { resolveSocketBaseUrl } from '@/lib/socket-url'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  onlineUsers: Set<string>
  connectionError: string | null
  refreshPresence: (userIds: string[]) => void
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
  connectionError: null,
  refreshPresence: () => undefined,
})

export const useSocket = () => useContext(SocketContext)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthContext()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)

  const refreshPresence = useCallback((userIds: string[]) => {
    const activeSocket = socketRef.current
    const ids = [...new Set(
      (userIds || [])
        .map((value) => String(value || '').trim())
        .filter(Boolean),
    )].slice(0, 200)

    if (!activeSocket?.connected || ids.length === 0) {
      setOnlineUsers(new Set())
      return
    }

    activeSocket.emit('dm:get-online-users', { userIds: ids }, (users: unknown) => {
      if (!Array.isArray(users)) return
      setOnlineUsers(new Set(users.map((value) => String(value || '').trim()).filter(Boolean)))
    })
  }, [])

  useEffect(() => {
    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      setSocket(null)
      setIsConnected(false)
      setOnlineUsers(new Set())
      setConnectionError(null)
      return
    }

    // Initialize socket
    const socketUrl = resolveSocketBaseUrl(process.env.NEXT_PUBLIC_API_URL)
    
    // Connect to /dm namespace
    const newSocket = io(`${socketUrl}/dm`, {
      auth: {
        token: `Bearer ${token}`
      },
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    })

    socketRef.current = newSocket

    newSocket.on('connect', () => {
      setIsConnected(true)
      setConnectionError(null)
    })

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false)
      setOnlineUsers(new Set())
      if (reason === 'io server disconnect') {
        setConnectionError('Authentication needs to be refreshed')
      }
    })

    newSocket.on('connect_error', (error: Error & { data?: { code?: string } }) => {
      setIsConnected(false)
      setConnectionError(
        error?.data?.code === 'UNAUTHORIZED'
          ? 'Authentication needs to be refreshed'
          : 'Reconnecting to live messages',
      )
    })

    newSocket.on('dm:connection:error', ({ code }: { code?: string }) => {
      setIsConnected(false)
      setConnectionError(code === 'UNAUTHORIZED' ? 'Authentication needs to be refreshed' : 'Reconnecting to live messages')
    })

    // Listen for status updates
    newSocket.on('user:status', ({ userId, status }: { userId: string, status: 'online' | 'offline' }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev)
        if (status === 'online') {
          next.add(userId)
        } else {
          next.delete(userId)
        }
        return next
      })
    })

    setSocket(newSocket)
    newSocket.connect()

    return () => {
      newSocket.disconnect()
      if (socketRef.current === newSocket) {
        socketRef.current = null
      }
      setSocket((current) => current === newSocket ? null : current)
    }
  }, [user?._id, token])

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers, connectionError, refreshPresence }}>
      {children}
    </SocketContext.Provider>
  )
}
