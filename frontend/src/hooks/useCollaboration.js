import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'

export const useCollaboration = (roomId, type) => {
  const [socket, setSocket] = useState(null)
  const [users, setUsers] = useState([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!roomId) return

    // Initialize Socket.IO connection
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'
    const newSocket = io(serverUrl, {
      query: { roomId, type }
    })

    newSocket.on('connect', () => {
      setIsConnected(true)
      console.log('Connected to collaboration server')
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
      console.log('Disconnected from collaboration server')
    })

    newSocket.on('users-update', (updatedUsers) => {
      setUsers(updatedUsers)
    })

    newSocket.on('user-joined', (user) => {
      console.log(`${user.name} joined the room`)
    })

    newSocket.on('user-left', (user) => {
      console.log(`${user.name} left the room`)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [roomId, type])

  const sendMessage = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data)
    }
  }

  const joinRoom = (userData) => {
    sendMessage('join-room', { roomId, type, user: userData })
  }

  const leaveRoom = () => {
    sendMessage('leave-room', { roomId })
  }

  return {
    socket,
    users,
    isConnected,
    sendMessage,
    joinRoom,
    leaveRoom
  }
}