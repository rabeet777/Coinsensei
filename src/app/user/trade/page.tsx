// src/app/user/trade/page.tsx
'use client'

import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import OrderBook from '@/components/OrderBook'
import { useEffect, useState } from 'react'
import { io as clientIo, Socket } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CurrencyDollarIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

type Order = {
  id: string
  user_id: string
  type: 'buy' | 'sell'
  price: number
  amount: number
  filled: number
  status: 'pending' | 'executed' | 'cancelled'
  created_at: string
  updated_at: string
  executed_at: string | null
  cancelled_at: string | null
}

export default function TradePage() {
  const router = useRouter()
  const session = useSession()
  const supabase = useSupabaseClient()

  // 1) Balances
  const [pkrBalance, setPkrBalance] = useState<number>(0)
  const [usdtBalance, setUsdtBalance] = useState<number>(0)

  // 2) User's orders
  const [orders, setOrders] = useState<Order[]>([])

  // 3) New order form
  const [type, setType] = useState<'buy' | 'sell'>('buy')
  const [price, setPrice] = useState<number>(0)
  const [amount, setAmount] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  // 4) WebSocket
  const [socket, setSocket] = useState<Socket | null>(null)

  // 5) UI state
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'cancelled'>('pending')

  // 5) Redirect to login if not authenticated
  useEffect(() => {
    if (session === null) {
      router.replace(`/auth/login?redirectTo=${encodeURIComponent('/user/trade')}`)
    }
  }, [session, router])

  // 6) Fetch balances once logged in
  useEffect(() => {
    if (!session?.user.id) return

    async function fetchBalances() {
      // At this point we know session and session.user exist
      const userId = (session as NonNullable<typeof session>).user.id
      const { data: pkrRow } = await supabase
        .from('user_pkr_wallets')
        .select('balance')
        .eq('user_id', userId)
        .single()
      if (pkrRow) setPkrBalance(Number(pkrRow.balance))

      const { data: usdtRow } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', userId)
        .single()
      if (usdtRow) setUsdtBalance(Number(usdtRow.balance))
    }

    fetchBalances()
  }, [session, supabase])

  // 7) Fetch the user's orders once logged in
  useEffect(() => {
    if (!session?.user.id) return

    fetch(`/api/getUserOrders?user_id=${session.user.id}`)
      .then(res => res.json())
      .then(json => setOrders(json.orders || []))
      .catch(console.error)
  }, [session])

  // 8) Socket.IO connection & listeners
  useEffect(() => {
    if (!socket && session?.user.id) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 
                     (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
      const socketClient = clientIo(baseUrl)
      setSocket(socketClient)

      socketClient.on('connect', () => {
        console.log('TradePage socket connected:', socketClient.id)
      })

      // Public order book (OrderBook sub‐component may subscribe internally)
      socketClient.on('orderBookUpdate', (book) => {
        // No direct handling here if <OrderBook/> uses its own hook
      })

      // Personal order updates: cancel or executed
      socketClient.on('userOrderUpdate', (updatedOrder: Order) => {
        if (updatedOrder.user_id === session.user.id) {
          setOrders(prev => {
            const idx = prev.findIndex(o => o.id === updatedOrder.id)
            if (idx !== -1) {
              const copy = [...prev]
              copy[idx] = updatedOrder
              return copy
            }
            return [updatedOrder, ...prev]
          })
        }
      })

      socketClient.on('disconnect', () => {
        console.log('TradePage socket disconnected')
      })

      return () => {
        socketClient.disconnect()
      }
    }
  }, [socket, session])

  // 9) Compute total PKR dynamically and fees
  const tradingFee = amount > 0 ? amount * 0.0015 : 0 // 0.15% fee
  const totalPKR = price > 0 && amount > 0 ? price * amount : 0
  const netUSDTReceived = amount > 0 ? amount - tradingFee : 0
  const netPKRReceived = price > 0 && amount > 0 ? (amount - tradingFee) * price : 0

  // 10) Place a new order
  const handlePlaceOrder = async () => {
    if (!session?.user.id || price <= 0 || amount <= 0) return

    setLoading(true)
    try {
      const res = await fetch('/api/placeOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: session.user.id,
          type,
          price,
          amount,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        // Immediately show the new order in Pending
        setOrders(prev => [data.order, ...prev])
        // Reset form
        setPrice(0)
        setAmount(0)

        // Refresh balances
        const { data: newPkrRow } = await supabase
          .from('user_pkr_wallets')
          .select('balance')
          .eq('user_id', session.user.id)
          .single()
        if (newPkrRow) setPkrBalance(Number(newPkrRow.balance))

        const { data: newUsdtRow } = await supabase
          .from('user_wallets')
          .select('balance')
          .eq('user_id', session.user.id)
          .single()
        if (newUsdtRow) setUsdtBalance(Number(newUsdtRow.balance))
      } else {
        console.error('Place order failed:', data.error || 'Unknown error')
        alert(data.error || 'Failed to place order. Please try again.')
      }
    } catch (err) {
      console.error('Place order failed:', err)
      alert('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // 11) Cancel an open order (immediately update state)
  const handleCancel = async (orderId: string) => {
    // Immediately mark it as "cancelled" locally:
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: 'cancelled' } : o))
    )

    // Then call the API (the watcher will also broadcast if needed)
    const res = await fetch('/api/cancelOrder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })
    if (!res.ok) {
      console.error('Cancel failed:', await res.json())
      alert('Failed to cancel order.')
      // If the API actually failed, revert that local change:
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: 'pending' } : o))
      )
    }
  }

  // 12) While session is loading, show placeholder
  if (session === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading trading platform...</p>
        </div>
      </div>
    )
  }
  if (!session) return null

  // 13) Split the user's orders by status
  const openOrders      = orders.filter(o => o.status === 'pending')
  const cancelledOrders = orders.filter(o => o.status === 'cancelled')
  const filledOrders    = orders.filter(o => o.status === 'executed')

  const getTabOrders = () => {
    switch (activeTab) {
      case 'pending': return openOrders
      case 'completed': return filledOrders
      case 'cancelled': return cancelledOrders
      default: return openOrders
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Spot Trading</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Real-time trading
                </span>
                <span>PKR/USDT</span>
                <span>Fee: 0.15%</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Last Price</div>
              <div className="text-2xl font-bold text-blue-600">₨ 289.50</div>
              <div className="text-sm text-green-600">+0.25%</div>
            </div>
          </div>
        </div>

        {/* Balances */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <BanknotesIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">PKR Wallet</h3>
                  <p className="text-sm text-gray-600">Available Balance</p>
                </div>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">
                ₨ {pkrBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">USDT Wallet</h3>
                  <p className="text-sm text-gray-600">Available Balance</p>
                </div>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">
                {usdtBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
            </div>
          </div>
            </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Trading Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <ArrowPathIcon className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Place Order</h2>
            </div>

            {/* Buy/Sell Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button
                onClick={() => setType('buy')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium transition-all duration-200 ${
                  type === 'buy'
                      ? 'bg-green-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                  <ArrowTrendingUpIcon className="h-4 w-4" />
                  Buy
              </button>
              <button
                onClick={() => setType('sell')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium transition-all duration-200 ${
                  type === 'sell'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                  <ArrowTrendingDownIcon className="h-4 w-4" />
                  Sell
              </button>
            </div>

            {/* Order Form */}
            <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (PKR)
                </label>
                  <div className="relative">
                <input
                  type="number"
                      placeholder="0.00"
                  value={price === 0 ? '' : price}
                  onChange={e => {
                    const v = e.target.value
                    setPrice(v === '' ? 0 : parseFloat(v))
                  }}
                      className="w-full pl-3 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-500 text-sm">PKR</span>
                    </div>
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (USDT)
                </label>
                  <div className="relative">
                <input
                  type="number"
                      placeholder="0.00"
                  value={amount === 0 ? '' : amount}
                  onChange={e => {
                    const v = e.target.value
                    setAmount(v === '' ? 0 : parseFloat(v))
                  }}
                      className="w-full pl-3 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-500 text-sm">USDT</span>
                    </div>
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total (PKR)
                </label>
                  <div className="w-full pl-3 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                    {totalPKR > 0 ? `₨ ${totalPKR.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '₨ 0.00'}
                  </div>
              </div>

                {/* Fee Breakdown */}
              {amount > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-900 mb-3">Order Summary</h4>
                  <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Trading Fee (0.15%):</span>
                        <span>{tradingFee.toFixed(6)} USDT</span>
                    </div>
                    {type === 'buy' && (
                      <>
                          <div className="flex justify-between text-gray-600">
                            <span>You pay:</span>
                            <span>₨ {totalPKR.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="border-t border-blue-200 pt-2 mt-2">
                            <div className="flex justify-between font-medium text-blue-900">
                              <span>You receive:</span>
                              <span>{netUSDTReceived.toFixed(6)} USDT</span>
                          </div>
                        </div>
                      </>
                    )}
                    {type === 'sell' && (
                      <>
                          <div className="flex justify-between text-gray-600">
                            <span>You provide:</span>
                            <span>{amount.toFixed(6)} USDT</span>
                          </div>
                          <div className="border-t border-blue-200 pt-2 mt-2">
                            <div className="flex justify-between font-medium text-blue-900">
                              <span>You receive:</span>
                              <span>₨ {netPKRReceived.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

                <button
                onClick={handlePlaceOrder}
                disabled={loading || price <= 0 || amount <= 0}
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  type === 'buy'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Placing Order...
                  </div>
                ) : (
                    `${type === 'buy' ? 'Buy' : 'Sell'} USDT`
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Order Book */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Order Book</h2>
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Live</span>
                </div>
              </div>
              <OrderBook />
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">My Orders</h2>

          {/* Tab Navigation */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6 max-w-md">
            {[
              { key: 'pending' as const, label: 'Open', icon: ClockIcon, count: openOrders.length },
              { key: 'completed' as const, label: 'Filled', icon: CheckCircleIcon, count: filledOrders.length },
              { key: 'cancelled' as const, label: 'Cancelled', icon: XCircleIcon, count: cancelledOrders.length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Orders Table */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <OrderTable
                orders={getTabOrders()}
                actionLabel={activeTab === 'pending' ? 'Cancel' : undefined}
                onAction={activeTab === 'pending' ? (o) => handleCancel(o.id) : undefined}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

type TableProps = {
  orders: Order[]
  actionLabel?: string
  onAction?: (order: Order) => void
}

function OrderTable({ orders, actionLabel, onAction }: TableProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No orders found</p>
        <p className="text-gray-400 text-sm">Your orders will appear here once you place them</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-gray-600 font-medium text-sm">Type</th>
            <th className="text-right py-3 px-4 text-gray-600 font-medium text-sm">Price</th>
            <th className="text-right py-3 px-4 text-gray-600 font-medium text-sm">Amount</th>
            <th className="text-right py-3 px-4 text-gray-600 font-medium text-sm">Filled</th>
            <th className="text-left py-3 px-4 text-gray-600 font-medium text-sm">Status</th>
            <th className="text-left py-3 px-4 text-gray-600 font-medium text-sm">Time</th>
            {actionLabel && (
              <th className="text-center py-3 px-4 text-gray-600 font-medium text-sm">Action</th>
            )}
          </tr>
        </thead>
        <tbody>
          {orders.map((order, index) => (
            <motion.tr
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="py-4 px-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  order.type === 'buy' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {order.type === 'buy' ? (
                    <ArrowTrendingUpIcon className="h-3 w-3" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-3 w-3" />
                  )}
                  {order.type.toUpperCase()}
                </span>
              </td>
              <td className="py-4 px-4 text-right text-gray-900 font-medium">
                ₨ {order.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-4 px-4 text-right text-gray-900">
                {order.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-4 px-4 text-right text-gray-900">
                {order.filled.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-4 px-4">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  order.status === 'executed' 
                    ? 'bg-green-100 text-green-700' 
                    : order.status === 'cancelled'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {order.status === 'executed' && <CheckCircleIcon className="h-3 w-3" />}
                  {order.status === 'cancelled' && <XCircleIcon className="h-3 w-3" />}
                  {order.status === 'pending' && <ClockIcon className="h-3 w-3" />}
                  {order.status}
                </span>
              </td>
              <td className="py-4 px-4 text-gray-600 text-sm">
                {new Date(order.created_at).toLocaleString()}
              </td>
              {actionLabel && onAction && (
                <td className="py-4 px-4 text-center">
                  <button
                    onClick={() => onAction(order)}
                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                  >
                    {actionLabel}
                  </button>
                </td>
              )}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
