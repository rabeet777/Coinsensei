'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ChartBarIcon,
  SparklesIcon,
  XMarkIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  LightBulbIcon,
  PauseIcon,
  CreditCardIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { Dialog, Transition } from '@headlessui/react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'

interface P2PConfig {
  buy_rate: number
  sell_rate: number
  min_order_amount: number
  max_order_amount: number
  is_active: boolean
  daily_buy_limit: number
  daily_sell_limit: number
}

interface DailyLimits {
  total_buy_amount: number
  total_sell_amount: number
  remaining_buy_limit: number
  remaining_sell_limit: number
}

interface P2POrder {
  id: string
  order_type: 'buy' | 'sell'
  usdt_amount: number
  pkr_amount: number
  rate: number
  status: string
  created_at: string
}

interface UserBalances {
  pkr_balance: number
  usdt_balance: number
}

export default function P2PExpressPage() {
  const [config, setConfig] = useState<P2PConfig | null>(null)
  const [limits, setLimits] = useState<DailyLimits | null>(null)
  const [balances, setBalances] = useState<UserBalances | null>(null)
  const [orders, setOrders] = useState<P2POrder[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  
  // Order form state
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy')
  const [usdtAmount, setUsdtAmount] = useState('')
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showRateChangeDialog, setShowRateChangeDialog] = useState(false)

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      await Promise.all([
        loadConfig(),
        loadBalances(),
        loadOrderHistory()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadConfig() {
    try {
      const response = await fetch('/api/user/p2p-express/config')
      const data = await response.json()
      
      if (data.success) {
        setConfig(data.config)
        setLimits(data.limits)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error loading config:', error)
      toast.error('Failed to load P2P Express configuration')
    }
  }

  async function loadBalances() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Get PKR balance
      const { data: pkrWallet, error: pkrError } = await supabase
        .from('user_pkr_wallets')
        .select('balance')
        .eq('user_id', session.user.id)
        .single()

      // Get USDT balance
      const { data: usdtWallet, error: usdtError } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', session.user.id)
        .single()

      if (pkrError || usdtError) {
        throw new Error('Failed to load wallet balances')
      }

      setBalances({
        pkr_balance: pkrWallet?.balance || 0,
        usdt_balance: usdtWallet?.balance || 0
      })
    } catch (error) {
      console.error('Error loading balances:', error)
      toast.error('Failed to load wallet balances')
    }
  }

  async function loadOrderHistory() {
    try {
      const response = await fetch('/api/user/p2p-express/order?limit=20')
      const data = await response.json()
      
      if (data.success) {
        setOrders(data.orders)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error loading order history:', error)
    }
  }

  async function handlePlaceOrder() {
    if (!config || !usdtAmount || parseFloat(usdtAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    const amount = parseFloat(usdtAmount)
    const rate = orderType === 'buy' ? config.buy_rate : config.sell_rate
    const pkrAmount = amount * rate

    // Validate amount limits
    if (amount < config.min_order_amount || amount > config.max_order_amount) {
      toast.error(`Amount must be between ${config.min_order_amount} and ${config.max_order_amount} USDT`)
      return
    }

    // Check daily limits
    if (limits) {
      const remainingLimit = orderType === 'buy' ? limits.remaining_buy_limit : limits.remaining_sell_limit
      if (amount > remainingLimit) {
        toast.error(`Daily ${orderType} limit exceeded. Remaining: ${remainingLimit.toFixed(2)} USDT`)
        return
      }
    }

    // Check balances
    if (balances) {
      if (orderType === 'buy' && pkrAmount > balances.pkr_balance) {
        toast.error('Insufficient PKR balance')
        return
      }
      if (orderType === 'sell' && amount > balances.usdt_balance) {
        toast.error('Insufficient USDT balance')
        return
      }
    }

    setProcessing(true)
    try {
      const response = await fetch('/api/user/p2p-express/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_type: orderType,
          usdt_amount: amount,
          expected_rate: rate
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        setShowOrderModal(false)
        setUsdtAmount('')
        await loadData() // Refresh all data
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Error placing order:', error)
      
      // Check if this is a rate change error
      if (error.message && error.message.includes('Rate has changed')) {
        setShowRateChangeDialog(true)
        setShowOrderModal(false)
      } else {
        toast.error(error.message || 'Failed to place order')
      }
    } finally {
      setProcessing(false)
    }
  }

  const calculatePkrAmount = () => {
    if (!config || !usdtAmount) return 0
    const amount = parseFloat(usdtAmount) || 0
    const rate = orderType === 'buy' ? config.buy_rate : config.sell_rate
    return amount * rate
  }

  const handleRefreshRates = async () => {
    setShowRateChangeDialog(false)
    await loadData()
    toast.success('Rates refreshed successfully!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full mx-auto"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 w-16 h-16 bg-violet-100 rounded-full mx-auto opacity-20"
            />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading P2P Express</h2>
          <p className="text-gray-600">Please wait while we prepare your trading interface...</p>
        </motion.div>
      </div>
    )
  }

  if (!config || !config.is_active) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full max-w-lg"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-blue-200 rounded-3xl blur-xl opacity-70"></div>
          
          <Card className="relative bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="p-12 text-center">
              {/* Animated icons */}
              <div className="relative mb-8">
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-lg"
                >
                  <PauseIcon className="h-12 w-12 text-white" />
                </motion.div>
                
                {/* Floating sparkles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${20 + i * 15}%`,
                      top: `${10 + (i % 2) * 30}%`
                    }}
                    animate={{
                      y: [-10, -20, -10],
                      opacity: [0.3, 0.8, 0.3],
                      scale: [0.8, 1.2, 0.8]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeInOut"
                    }}
                  >
                    <SparklesIcon className="h-4 w-4 text-purple-400" />
                  </motion.div>
                ))}
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  We're Taking a Break!
                </h2>
                
                <div className="space-y-3">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    P2P Express is temporarily paused for maintenance and updates
                  </p>
                  
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium">
                    <InformationCircleIcon className="h-4 w-4" />
                    <span>We'll be back soon with better features!</span>
                  </div>
                </div>
                
                <div className="pt-6 space-y-3">
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <LightBulbIcon className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm">Meanwhile, you can use regular trading</span>
                  </div>
                  
                  <Button
                    onClick={() => window.location.href = '/user/trade'}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <ArrowRightIcon className="h-4 w-4 mr-2" />
                    Go to Trading
                  </Button>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-violet-500 to-blue-500 rounded-xl shadow-lg">
              <CreditCardIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
              P2P Express
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Buy and sell USDT instantly with competitive rates and lightning-fast transactions
          </p>
        </motion.div>

        {/* Current Rates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
        >
          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
              <CardHeader className="pb-4 relative">
                <CardTitle className="flex items-center gap-3 text-green-700 text-xl">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ArrowUpIcon className="h-6 w-6" />
                  </div>
                  Buy USDT
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  ₨{config.buy_rate.toFixed(2)}
                </div>
                <p className="text-green-600/80 font-medium">per USDT</p>
                <div className="mt-4 p-3 bg-green-100/50 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">Get USDT instantly with PKR</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-rose-50 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
              <CardHeader className="pb-4 relative">
                <CardTitle className="flex items-center gap-3 text-red-700 text-xl">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <ArrowDownIcon className="h-6 w-6" />
                  </div>
                  Sell USDT
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  ₨{config.sell_rate.toFixed(2)}
                </div>
                <p className="text-red-600/80 font-medium">per USDT</p>
                <div className="mt-4 p-3 bg-red-100/50 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">Convert USDT to PKR instantly</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Balances */}
        {balances && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-gray-800">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <BanknotesIcon className="h-5 w-5 text-emerald-600" />
                  </div>
                  PKR Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  ₨{balances.pkr_balance.toLocaleString()}
                </div>
                <p className="text-gray-600">Available for trading</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-gray-800">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  USDT Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {balances.usdt_balance.toFixed(2)} USDT
                </div>
                <p className="text-gray-600">Available for trading</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => {
                setOrderType('buy')
                setShowOrderModal(true)
              }}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <ArrowUpIcon className="h-6 w-6 mr-3" />
              Buy USDT
            </Button>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => {
                setOrderType('sell')
                setShowOrderModal(true)
              }}
              className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <ArrowDownIcon className="h-6 w-6 mr-3" />
              Sell USDT
            </Button>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => setShowHistoryModal(true)}
              variant="outline"
              className="w-full border-2 border-violet-200 hover:border-violet-300 text-violet-700 hover:bg-violet-50 py-6 text-lg font-semibold rounded-xl transition-all duration-300"
            >
              <ClockIcon className="h-6 w-6 mr-3" />
              Order History
            </Button>
          </motion.div>
        </motion.div>

        {/* Recent Orders */}
        {orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <ChartBarIcon className="h-6 w-6 text-violet-600" />
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                          order.order_type === 'buy' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {order.order_type === 'buy' ? 
                            <ArrowUpIcon className="h-5 w-5" /> : 
                            <ArrowDownIcon className="h-5 w-5" />
                          }
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {order.order_type === 'buy' ? 'Bought' : 'Sold'} {order.usdt_amount} USDT
                          </div>
                          <div className="text-sm text-gray-600">
                            ₨{order.pkr_amount.toLocaleString()} at ₨{order.rate.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={order.status === 'completed' ? 'default' : 'secondary'}
                          className={order.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {order.status === 'completed' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                          {order.status}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Enhanced Order Modal */}
        <AnimatePresence>
          {showOrderModal && (
            <Dialog 
              open={showOrderModal} 
              onClose={() => setShowOrderModal(false)} 
              className="relative z-50"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm"
              />

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
                      {/* Modal Header */}
                      <div className={`px-8 pt-8 pb-6 bg-gradient-to-r ${
                        orderType === 'buy' 
                          ? 'from-green-500 to-emerald-500' 
                          : 'from-red-500 to-rose-500'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                                           {orderType === 'buy' ? 
                               <ArrowUpIcon className="h-6 w-6 text-white" /> : 
                               <ArrowDownIcon className="h-6 w-6 text-white" />
                             }
                            </div>
                            <Dialog.Title className="text-2xl font-bold text-white">
                              {orderType === 'buy' ? 'Buy USDT' : 'Sell USDT'}
                            </Dialog.Title>
                          </div>
                          <button
                            onClick={() => setShowOrderModal(false)}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <XMarkIcon className="h-5 w-5 text-white" />
                          </button>
                        </div>
                      </div>

                      <div className="px-8 py-6 space-y-6">
                        {/* Current Rate */}
                        <div className="bg-gray-50 p-6 rounded-2xl">
                          <div className="text-sm text-gray-600 mb-2">Current Rate</div>
                          <div className="text-2xl font-bold text-gray-900">
                            ₨{(orderType === 'buy' ? config.buy_rate : config.sell_rate).toFixed(2)}
                            <span className="text-lg font-normal text-gray-600 ml-2">per USDT</span>
                          </div>
                        </div>

                        {/* Amount Input */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            USDT Amount
                          </label>
                          <input
                            type="number"
                            value={usdtAmount}
                            onChange={(e) => setUsdtAmount(e.target.value)}
                            placeholder={`Min: ${config.min_order_amount}, Max: ${config.max_order_amount}`}
                            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent text-lg font-medium transition-all"
                          />
                        </div>

                        {/* Calculation */}
                        {usdtAmount && parseFloat(usdtAmount) > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-gradient-to-r from-violet-50 to-blue-50 p-6 rounded-2xl border border-violet-100"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-sm font-medium text-gray-600">USDT Amount</span>
                              <span className="font-semibold text-gray-900">{parseFloat(usdtAmount).toFixed(2)} USDT</span>
                            </div>
                            <div className="flex items-center justify-center my-4">
                              <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center">
                                <ArrowRightIcon className="h-4 w-4 text-white" />
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-600">PKR Amount</span>
                              <span className="font-bold text-xl bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                                ₨{calculatePkrAmount().toLocaleString()}
                              </span>
                            </div>
                          </motion.div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4">
                          <Button
                            onClick={() => setShowOrderModal(false)}
                            variant="outline"
                            className="flex-1 py-4 border-2 rounded-xl font-semibold"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handlePlaceOrder}
                            disabled={processing || !usdtAmount || parseFloat(usdtAmount) <= 0}
                            className={`flex-1 py-4 rounded-xl font-semibold text-white shadow-lg transition-all ${
                              orderType === 'buy' 
                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                                : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {processing ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                                               {orderType === 'buy' ? 
                                 <ArrowUpIcon className="h-5 w-5 mr-2" /> : 
                                 <ArrowDownIcon className="h-5 w-5 mr-2" />
                               }
                                {orderType === 'buy' ? 'Buy' : 'Sell'} USDT
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </Dialog.Panel>
                  </motion.div>
                </div>
              </div>
            </Dialog>
          )}
        </AnimatePresence>

        {/* Enhanced Order History Modal */}
        <AnimatePresence>
          {showHistoryModal && (
            <Dialog 
              open={showHistoryModal} 
              onClose={() => setShowHistoryModal(false)} 
              className="relative z-50"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm"
              />

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
                      {/* Modal Header */}
                      <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-violet-500 to-blue-500">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <ClockIcon className="h-6 w-6 text-white" />
                            </div>
                            <Dialog.Title className="text-2xl font-bold text-white">
                              P2P Express Order History
                            </Dialog.Title>
                          </div>
                          <button
                            onClick={() => setShowHistoryModal(false)}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <XMarkIcon className="h-5 w-5 text-white" />
                          </button>
                        </div>
                      </div>

                      <div className="p-8">
                        <div className="max-h-96 overflow-y-auto">
                          {orders.length === 0 ? (
                            <div className="text-center py-12">
                              <ClockIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Orders Yet</h3>
                              <p className="text-gray-500">Your P2P Express orders will appear here</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {orders.map((order, index) => (
                                <motion.div
                                  key={order.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-lg ${
                                        order.order_type === 'buy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                      }`}>
                                        {order.order_type === 'buy' ? 
                                          <ArrowUpIcon className="h-4 w-4" /> : 
                                          <ArrowDownIcon className="h-4 w-4" />
                                        }
                                      </div>
                                      <span className="font-semibold text-lg capitalize">{order.order_type}</span>
                                      <Badge 
                                        variant={order.status === 'completed' ? 'default' : 'secondary'}
                                        className={order.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                                      >
                                        {order.status === 'completed' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                                        {order.status}
                                      </Badge>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {new Date(order.created_at).toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-600 block mb-1">USDT Amount</span>
                                      <div className="font-semibold">{order.usdt_amount} USDT</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-600 block mb-1">PKR Amount</span>
                                      <div className="font-semibold">₨{order.pkr_amount.toLocaleString()}</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-600 block mb-1">Rate</span>
                                      <div className="font-semibold">₨{order.rate.toFixed(2)}</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-600 block mb-1">Order ID</span>
                                      <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                        {order.id.slice(0, 8)}...
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-8">
                          <Button
                            onClick={() => setShowHistoryModal(false)}
                            className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white py-4 rounded-xl font-semibold"
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    </Dialog.Panel>
                  </motion.div>
                </div>
              </div>
            </Dialog>
          )}
        </AnimatePresence>

        {/* Rate Change Dialog */}
        <AnimatePresence>
          {showRateChangeDialog && (
            <Dialog 
              open={showRateChangeDialog} 
              onClose={() => setShowRateChangeDialog(false)} 
              className="relative z-50"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              />

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
                      {/* Dialog Header */}
                      <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-amber-500 to-orange-500">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                            </div>
                            <Dialog.Title className="text-2xl font-bold text-white">
                              Rate Changed
                            </Dialog.Title>
                          </div>
                          <button
                            onClick={() => setShowRateChangeDialog(false)}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <XMarkIcon className="h-5 w-5 text-white" />
                          </button>
                        </div>
                      </div>

                      <div className="px-8 py-8 text-center space-y-6">
                        {/* Icon and Message */}
                        <div className="space-y-4">
                          <motion.div
                            animate={{ 
                              rotate: [0, -5, 5, -5, 0],
                              scale: [1, 1.1, 1]
                            }}
                            transition={{ 
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full shadow-lg"
                          >
                            <ExclamationTriangleIcon className="h-10 w-10 text-amber-600" />
                          </motion.div>
                          
                          <div className="space-y-3">
                            <h3 className="text-xl font-semibold text-gray-900">
                              Exchange Rate Updated
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                              The exchange rates have been updated since you started your order. 
                              Please refresh to see the latest rates and try again.
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4">
                          <Button
                            onClick={() => setShowRateChangeDialog(false)}
                            variant="outline"
                            className="flex-1 py-3 border-2 rounded-xl font-semibold"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleRefreshRates}
                            className="flex-1 py-3 rounded-xl font-semibold text-white shadow-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 transition-all"
                          >
                            <ArrowPathIcon className="h-5 w-5 mr-2" />
                            Refresh Rates
                          </Button>
                        </div>
                      </div>
                    </Dialog.Panel>
                  </motion.div>
                </div>
              </div>
            </Dialog>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 