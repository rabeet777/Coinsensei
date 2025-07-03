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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
    const socketInstance = io(baseUrl, {
      path: '/socket.io',
    })

    // Listen for order book updates
    socketInstance.on('orderBookUpdate', (data: Order[]) => {
      setOrderBook(data)
    })

    setSocket(socketInstance)

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect()
    }
  }, [])

  return { orderBook }
} 