"use client"

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthContext } from '@/app/providers/auth-provider'
import { resolveSocketBaseUrl } from '@/lib/socket-url'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  onlineUsers: Set<string>
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
})

export const useSocket = () => useContext(SocketContext)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthContext()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
        setIsConnected(false)
        setOnlineUsers(new Set())
      }
      return
    }

    // Initialize socket
    const socketUrl = resolveSocketBaseUrl(process.env.NEXT_PUBLIC_API_URL)
    
    // Connect to /dm namespace
    const newSocket = io(`${socketUrl}/dm`, {
      auth: {
        token: `Bearer ${token}`
      },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = newSocket

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id)
      setIsConnected(true)
      
      // Request initial online users
      newSocket.emit('dm:get-online-users', {}, (users: string[]) => {
        if (Array.isArray(users)) {
          setOnlineUsers(new Set(users))
        }
      })
    })

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err)
      setIsConnected(false)
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

    return () => {
      newSocket.disconnect()
      socketRef.current = null
    }
  }, [user?.id, token])

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  )
}
