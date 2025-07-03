'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline'

type UserTrade = {
  id: string
  trade_amount: number
  trade_price: number
  total_value: number
  buyer_fee: number
  seller_fee: number
  platform_fee_total: number
  trade_status: string
  executed_at: string
  buyer_user_id: string
  seller_user_id: string
  buyer_email: string
  seller_email: string
  user_role: 'buyer' | 'seller'
  user_received_amount: number
  user_received_currency: 'USDT' | 'PKR'
  counterparty_email: string
  exchange_rate: number
}

type TradeStats = {
  total_trades: number
  total_volume_usdt: number
  total_volume_pkr: number
  total_fees_paid: number
}

interface TradeHistoryProps {
  userId: string
}

export default function TradeHistory({ userId }: TradeHistoryProps) {
  const [trades, setTrades] = useState<UserTrade[]>([])
  const [stats, setStats] = useState<TradeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  })

  const fetchTrades = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        user_id: userId,
        page: page.toString(),
        limit: '10',
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== ''))
      })

      const response = await fetch(`/api/getUserTrades?${params}`)
      const data = await response.json()

      if (response.ok) {
        setTrades(data.trades)
        setStats(data.stats)
        setCurrentPage(page)
        setTotalPages(data.pagination.totalPages)
      } else {
        console.error('Failed to fetch trades:', data.error)
      }
    } catch (error) {
      console.error('Error fetching trades:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchTrades(1)
    }
  }, [userId, filters])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const formatCurrency = (amount: number, currency: 'USDT' | 'PKR') => {
    if (currency === 'PKR') {
      return `₨${amount.toLocaleString()}`
    }
    return `${amount.toFixed(4)} USDT`
  }

  const getRoleIcon = (role: 'buyer' | 'seller') => {
    return role === 'buyer' ? 
      <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" /> : 
      <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
  }

  const getRoleColor = (role: 'buyer' | 'seller') => {
    return role === 'buyer' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Trade History</h2>
          <p className="text-gray-600 mt-1">Your completed trading transactions</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Trades</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_trades}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Volume (USDT)</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_volume_usdt.toFixed(2)}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <BanknotesIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Volume (PKR)</p>
                <p className="text-2xl font-bold text-gray-900">₨{stats.total_volume_pkr.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Fees Paid</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_fees_paid.toFixed(4)} USDT</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4">
          <CalendarIcon className="h-5 w-5 text-gray-400" />
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Start Date"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="End Date"
          />
        </div>
      </div>

      {/* Trades List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Trades</h3>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading trades...</p>
          </div>
        ) : trades.length === 0 ? (
          <div className="p-12 text-center">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No trades found</p>
            <p className="text-gray-500 text-sm mt-2">Start trading to see your transaction history here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {trades.map((trade, index) => (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(trade.user_role)}`}>
                        {getRoleIcon(trade.user_role)}
                        <span className="ml-1">{trade.user_role.toUpperCase()}</span>
                      </span>
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(trade.trade_amount, 'USDT')} at ₨{trade.trade_price.toFixed(2)}
                        </p>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Completed
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-sm text-gray-500">
                          Counterparty: {trade.counterparty_email}
                        </p>
                        <p className="text-sm text-gray-500">
                          ID: {trade.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(trade.user_received_amount, trade.user_received_currency)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(trade.executed_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Fee: {((trade.user_role === 'buyer' ? trade.buyer_fee : trade.seller_fee)).toFixed(4)} USDT
                    </div>
                  </div>
                </div>

                {/* Trade Details */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-gray-600">Trade Amount</div>
                    <div className="font-medium">{trade.trade_amount.toFixed(4)} USDT</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-gray-600">Exchange Rate</div>
                    <div className="font-medium">₨{trade.exchange_rate.toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-gray-600">Total Value</div>
                    <div className="font-medium">₨{trade.total_value.toLocaleString()}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => fetchTrades(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => fetchTrades(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => fetchTrades(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 