import { useEffect, useState } from 'react'
import io from 'socket.io-client'

type Order = {
  id: string
  user_id: string
  type: 'buy' | 'sell'
  price: number
  amount: number
  filled: number
  status: 'pending' | 'executed' | 'cancelled'
  created_at: string
}

export function useOrderBookSocket() {
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null)
  const [orderBook, setOrderBook] = useState<Order[] | null>(null)

  useEffect(() => {
    // Initialize socket connection
    const isDevelopment = process.env.NODE_ENV === 'development'
    const socketUrl = isDevelopment 
      ? 'http://localhost:3000'
      : 'wss://rabeet777-workers.hf.space'

    const socketInstance = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket'],
      secure: !isDevelopment
    })

    // Listen for order book updates
    socketInstance.on('orderBookUpdate', (data: Order[]) => {
      setOrderBook(data)
    })

    // Add connection status logging
    socketInstance.on('connect', () => {
      console.log('Socket connected successfully')
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    setSocket(socketInstance)

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect()
    }
  }, [])

  return { orderBook }
} 