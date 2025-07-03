'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CogIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlayIcon,
  PauseIcon,
  ChartBarIcon,
  UsersIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { Dialog, Transition } from '@headlessui/react'
import { toast } from 'react-hot-toast'

interface P2PConfig {
  id: string
  buy_rate: number
  sell_rate: number
  min_order_amount: number
  max_order_amount: number
  is_active: boolean
  daily_buy_limit: number
  daily_sell_limit: number
  created_at: string
  updated_at: string
}

interface P2POrder {
  id: string
  user_id: string
  order_type: 'buy' | 'sell'
  usdt_amount: number
  pkr_amount: number
  rate: number
  status: string
  created_at: string
  user_profile: {
    uid: string
    full_name: string
    phone_number: string
    kyc_status: string
  }
}

interface OrderStatistics {
  total_orders: number
  total_buy_orders: number
  total_sell_orders: number
  total_usdt_volume: number
  total_pkr_volume: number
  completed_orders: number
  pending_orders: number
  failed_orders: number
}

export default function AdminP2PExpressPage() {
  const [config, setConfig] = useState<P2PConfig | null>(null)
  const [orders, setOrders] = useState<P2POrder[]>([])
  const [statistics, setStatistics] = useState<OrderStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  
  // Config form state
  const [configForm, setConfigForm] = useState({
    buy_rate: 0,
    sell_rate: 0,
    min_order_amount: 0,
    max_order_amount: 0,
    is_active: true,
    daily_buy_limit: 0,
    daily_sell_limit: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      await Promise.all([
        loadConfig(),
        loadOrders()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadConfig() {
    try {
      const response = await fetch('/api/admin/p2p-express/config')
      const data = await response.json()
      
      if (data.success) {
        setConfig(data.config)
        setConfigForm({
          buy_rate: data.config.buy_rate,
          sell_rate: data.config.sell_rate,
          min_order_amount: data.config.min_order_amount,
          max_order_amount: data.config.max_order_amount,
          is_active: data.config.is_active,
          daily_buy_limit: data.config.daily_buy_limit,
          daily_sell_limit: data.config.daily_sell_limit
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error loading config:', error)
      toast.error('Failed to load P2P Express configuration')
    }
  }

  async function loadOrders() {
    try {
      const response = await fetch('/api/admin/p2p-express/orders?limit=20')
      const data = await response.json()
      
      if (data.success) {
        setOrders(data.orders)
        setStatistics(data.statistics)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Failed to load P2P Express orders')
    }
  }

  async function updateConfig() {
    setUpdating(true)
    try {
      const response = await fetch('/api/admin/p2p-express/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configForm)
      })

      const data = await response.json()
      
      if (data.success) {
        setConfig(data.config)
        setShowConfigModal(false)
        toast.success(data.message)
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Error updating config:', error)
      toast.error(error.message || 'Failed to update configuration')
    } finally {
      setUpdating(false)
    }
  }

  async function toggleSystem() {
    if (!config) return
    
    setUpdating(true)
    try {
      const response = await fetch('/api/admin/p2p-express/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: !config.is_active
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setConfig(data.config)
        toast.success(`P2P Express ${data.config.is_active ? 'activated' : 'deactivated'}`)
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Error toggling system:', error)
      toast.error(error.message || 'Failed to toggle system')
    } finally {
      setUpdating(false)
    }
  }

  if (loading && !config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading P2P Express management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">P2P Express Management</h1>
              <p className="text-gray-600">Manage rates, orders, and system settings</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowConfigModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CogIcon className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                onClick={toggleSystem}
                disabled={updating}
                className={`${
                  config?.is_active
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {updating ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : config?.is_active ? (
                  <PauseIcon className="h-4 w-4 mr-2" />
                ) : (
                  <PlayIcon className="h-4 w-4 mr-2" />
                )}
                {config?.is_active ? 'Take Break' : 'Activate'}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    config?.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {config?.is_active ? <PlayIcon className="h-5 w-5" /> : <PauseIcon className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">System Status</h3>
                    <p className="text-sm text-gray-600">
                      P2P Express is currently {config?.is_active ? 'active' : 'inactive'}
                    </p>
                  </div>
                </div>
                {config && (
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Current Rates</div>
                    <div className="font-medium">
                      Buy: ₨{config.buy_rate.toFixed(2)} | Sell: ₨{config.sell_rate.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Statistics */}
        {statistics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ChartBarIcon className="h-4 w-4" />
                  Total Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {statistics.total_orders.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Buy: {statistics.total_buy_orders} | Sell: {statistics.total_sell_orders}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CurrencyDollarIcon className="h-4 w-4" />
                  USDT Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {statistics.total_usdt_volume.toFixed(0)}
                </div>
                <div className="text-xs text-gray-600 mt-1">Total USDT traded</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BanknotesIcon className="h-4 w-4" />
                  PKR Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  ₨{statistics.total_pkr_volume.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 mt-1">Total PKR traded</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <UsersIcon className="h-4 w-4" />
                  Status Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium text-green-600">{statistics.completed_orders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending:</span>
                    <span className="font-medium text-yellow-600">{statistics.pending_orders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Failed:</span>
                    <span className="font-medium text-red-600">{statistics.failed_orders}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent P2P Express Orders</CardTitle>
                <Button
                  onClick={loadOrders}
                  variant="outline"
                  size="sm"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl font-medium text-gray-600 mb-2">No orders found</p>
                  <p className="text-gray-500">P2P Express orders will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="font-medium text-gray-900">
                                {order.user_profile?.full_name || 'Unknown'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.user_profile?.phone_number || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className={`p-1 rounded-full ${
                                order.order_type === 'buy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                              }`}>
                                {order.order_type === 'buy' ? 
                                  <ArrowUpIcon className="h-3 w-3" /> : 
                                  <ArrowDownIcon className="h-3 w-3" />
                                }
                              </div>
                              <span className="capitalize font-medium">{order.order_type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="font-medium">{order.usdt_amount} USDT</div>
                              <div className="text-sm text-gray-500">₨{order.pkr_amount.toLocaleString()}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium">₨{order.rate.toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={
                              order.status === 'completed' ? 'default' :
                              order.status === 'pending' ? 'secondary' :
                              order.status === 'failed' ? 'destructive' : 'outline'
                            }>
                              {order.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Configuration Modal */}
        <Transition show={showConfigModal} as={React.Fragment}>
          <Dialog onClose={() => setShowConfigModal(false)} className="relative z-50">
            <Transition.Child
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                    <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-6">
                      P2P Express Configuration
                    </Dialog.Title>

                    <div className="space-y-4">
                      {/* Rates */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Buy Rate (PKR per USDT)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={configForm.buy_rate}
                            onChange={(e) => setConfigForm(prev => ({ ...prev, buy_rate: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sell Rate (PKR per USDT)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={configForm.sell_rate}
                            onChange={(e) => setConfigForm(prev => ({ ...prev, sell_rate: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Order Limits */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Min Order (USDT)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={configForm.min_order_amount}
                            onChange={(e) => setConfigForm(prev => ({ ...prev, min_order_amount: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Order (USDT)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={configForm.max_order_amount}
                            onChange={(e) => setConfigForm(prev => ({ ...prev, max_order_amount: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Daily Limits */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Daily Buy Limit (USDT)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={configForm.daily_buy_limit}
                            onChange={(e) => setConfigForm(prev => ({ ...prev, daily_buy_limit: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Daily Sell Limit (USDT)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={configForm.daily_sell_limit}
                            onChange={(e) => setConfigForm(prev => ({ ...prev, daily_sell_limit: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* System Status */}
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="is_active"
                          checked={configForm.is_active}
                          onChange={(e) => setConfigForm(prev => ({ ...prev, is_active: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                          System Active
                        </label>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={() => setShowConfigModal(false)}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={updateConfig}
                          disabled={updating}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          {updating ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            'Update Configuration'
                          )}
                        </Button>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </div>
  )
} 