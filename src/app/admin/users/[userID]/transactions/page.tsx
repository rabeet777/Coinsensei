'use client'

import React, { useState, useEffect, Fragment } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import { Tab } from '@headlessui/react'
import {
  ArrowLeftIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  BanknotesIcon,
  WalletIcon,
  DocumentMagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

type Transaction = {
  id: string
  type: 'pkr_deposit' | 'pkr_withdrawal' | 'usdt_deposit' | 'usdt_withdrawal'
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  created_at: string
  description: string
  details?: any
}

const transactionTypeConfig = {
  pkr_deposit: {
    label: 'PKR Deposit',
    icon: ArrowDownIcon,
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    iconColor: 'text-green-600'
  },
  pkr_withdrawal: {
    label: 'PKR Withdrawal',
    icon: ArrowUpIcon,
    bgColor: 'bg-red-100',
    textColor: 'text-red-600',
    iconColor: 'text-red-600'
  },
  usdt_deposit: {
    label: 'USDT Deposit',
    icon: ArrowDownIcon,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    iconColor: 'text-blue-600'
  },
  usdt_withdrawal: {
    label: 'USDT Withdrawal',
    icon: ArrowUpIcon,
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
    iconColor: 'text-purple-600'
  }
}

const statusConfig = {
  pending: {
    classes: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: ClockIcon,
    label: 'Pending'
  },
  approved: {
    classes: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircleIcon,
    label: 'Approved'
  },
  completed: {
    classes: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircleIcon,
    label: 'Completed'
  },
  rejected: {
    classes: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircleIcon,
    label: 'Rejected'
  }
}

const tabs = ['all', 'pkr_deposit', 'pkr_withdrawal', 'usdt_deposit', 'usdt_withdrawal'] as const
type TabType = typeof tabs[number]

export default function UserTransactionsPage() {
  const params = useParams()
  const userId = (params?.userID as string) || ''
  const supabase = createClientComponentClient<Database>()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTab, setCurrentTab] = useState<TabType>('all')

  // Load user info and transactions
  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      // Load user profile (this is the main table)
      const { data: profileData, error: profileError } = await supabase
        .from('user_profile')
        .select('uid, full_name')
        .eq('uid', userId)
        .single()

      if (profileError) throw profileError

      // Combine user data
      const combinedUserData = {
        id: profileData.uid,
        email: profileData.uid, // Using uid as email identifier
        user_profile: [profileData]
      }

      setUserInfo(combinedUserData)

      // Load all transactions
      const allTransactions: Transaction[] = []

      // PKR Deposits
      const { data: pkrDeposits } = await supabase
        .from('user_pkr_deposits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      pkrDeposits?.forEach((tx, index) => {
        // Generate robust ID with fallbacks
        const validId = tx.id && 
                        tx.id !== 'undefined' && 
                        tx.id !== 'null' && 
                        String(tx.id).trim() !== ''
        const transactionId = validId ? 
          `pkr_deposit_${tx.id}` : 
          `pkr_deposit_${Date.parse(tx.created_at) || Date.now()}_${index}`

        allTransactions.push({
          id: transactionId,
          type: 'pkr_deposit',
          amount: tx.amount,
          status: tx.status,
          created_at: tx.created_at,
          description: `PKR Deposit - ₨${tx.amount.toLocaleString()}`,
          details: tx
        })
      })

      // PKR Withdrawals - use correct table
      const { data: pkrWithdrawals } = await supabase
        .from('user_pkr_withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      pkrWithdrawals?.forEach((tx, index) => {
        // Generate robust ID with fallbacks
        const validId = tx.id && 
                        tx.id !== 'undefined' && 
                        tx.id !== 'null' && 
                        String(tx.id).trim() !== ''
        const transactionId = validId ? 
          `pkr_withdrawal_${tx.id}` : 
          `pkr_withdrawal_${Date.parse(tx.created_at) || Date.now()}_${index}`

        allTransactions.push({
          id: transactionId,
          type: 'pkr_withdrawal',
          amount: tx.amount,
          status: tx.status,
          created_at: tx.created_at,
          description: `PKR Withdrawal - ₨${tx.amount.toLocaleString()}`,
          details: tx
        })
      })

      // USDT Transactions (from processed_txs)
      const { data: usdtTxs } = await supabase
        .from('processed_txs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      usdtTxs?.forEach((tx, index) => {
        // Generate robust ID with fallbacks
        const validId = tx.id && 
                        tx.id !== 'undefined' && 
                        tx.id !== 'null' && 
                        String(tx.id).trim() !== ''
        const transactionId = validId ? 
          `usdt_deposit_${tx.id}` : 
          `usdt_deposit_${Date.parse(tx.created_at) || Date.now()}_${index}`

        allTransactions.push({
          id: transactionId,
          type: 'usdt_deposit',
          amount: tx.amount,
          status: tx.status === 'confirmed' ? 'completed' : 'pending',
          created_at: tx.created_at,
          description: `USDT Deposit - $${tx.amount.toLocaleString()}`,
          details: tx
        })
      })

      // USDT Withdrawals - from withdrawals table
      const { data: usdtWithdrawalsData, error: usdtWithdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (!usdtWithdrawalsError && usdtWithdrawalsData) {
        usdtWithdrawalsData.forEach((tx, index) => {
          // Generate robust ID with fallbacks
          const validId = tx.id && 
                          tx.id !== 'undefined' && 
                          tx.id !== 'null' && 
                          String(tx.id).trim() !== ''
          const transactionId = validId ? 
            `usdt_withdrawal_${tx.id}` : 
            `usdt_withdrawal_${Date.parse(tx.created_at) || Date.now()}_${index}`

          allTransactions.push({
            id: transactionId,
            type: 'usdt_withdrawal',
            amount: tx.amount,
            status: tx.status,
            created_at: tx.created_at,
            description: `USDT Withdrawal - $${tx.amount.toLocaleString()}`,
            details: tx
          })
        })
      }

      // Sort all transactions by date
      allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      setTransactions(allTransactions)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      loadData()
    }
  }, [userId])

  // Calculate statistics
  const stats = {
    total: transactions.length,
    pkrDeposits: transactions.filter(tx => tx.type === 'pkr_deposit').length,
    pkrWithdrawals: transactions.filter(tx => tx.type === 'pkr_withdrawal').length,
    usdtDeposits: transactions.filter(tx => tx.type === 'usdt_deposit').length,
    usdtWithdrawals: transactions.filter(tx => tx.type === 'usdt_withdrawal').length,
    totalPkrAmount: transactions
      .filter(tx => tx.type === 'pkr_deposit' && (tx.status === 'approved' || tx.status === 'completed'))
      .reduce((sum, tx) => sum + tx.amount, 0),
    totalUsdtAmount: transactions
      .filter(tx => tx.type === 'usdt_deposit' && (tx.status === 'approved' || tx.status === 'completed'))
      .reduce((sum, tx) => sum + tx.amount, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      </div>
    )
  }

  const tabLabels: Record<TabType, string> = {
    all: 'All Transactions',
    pkr_deposit: 'PKR Deposits',
    pkr_withdrawal: 'PKR Withdrawals',
    usdt_deposit: 'USDT Deposits',
    usdt_withdrawal: 'USDT Withdrawals'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={`/admin/users/${userId}`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Transaction History
                </h1>
                <p className="text-gray-600 mt-1">
                  {userInfo?.user_profile?.[0]?.full_name || `User ID: ${userId}`} • {transactions.length} transactions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">PKR Deposits</p>
                <p className="text-3xl font-bold text-green-600">{stats.pkrDeposits}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <ArrowDownIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">PKR Withdrawals</p>
                <p className="text-3xl font-bold text-red-600">{stats.pkrWithdrawals}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-xl">
                <ArrowUpIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">USDT Deposits</p>
                <p className="text-3xl font-bold text-blue-600">{stats.usdtDeposits}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <ArrowDownIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">USDT Withdrawals</p>
                <p className="text-3xl font-bold text-purple-600">{stats.usdtWithdrawals}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <ArrowUpIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total USDT</p>
                <p className="text-2xl font-bold text-blue-600">${stats.totalUsdtAmount.toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <WalletIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                <span className="text-red-800 font-medium">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ChartBarIcon className="h-5 w-5" />
              )}
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <Tab.Group 
            selectedIndex={tabs.indexOf(currentTab)} 
            onChange={i => setCurrentTab(tabs[i])}
          >
            <div className="border-b border-gray-200">
              <Tab.List className="flex">
                {tabs.map((tab) => {
                  const count = tab === 'all' 
                    ? transactions.length 
                    : transactions.filter(tx => tx.type === tab).length
                  
                  return (
                    <Tab key={tab}
                      className={({ selected }) =>
                        `flex-1 flex items-center justify-center gap-3 px-6 py-4 text-sm font-medium transition-all ${
                          selected
                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`
                      }>
                      {tabLabels[tab]}
                      {count > 0 && (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          currentTab === tab 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {count}
                        </span>
                      )}
                    </Tab>
                  )
                })}
              </Tab.List>
            </div>

            <Tab.Panels>
              {tabs.map((tab) => (
                <Tab.Panel key={tab} className="p-6">
                  {(() => {
                    // Filter transactions for this specific tab
                    const tabFilteredTransactions = transactions.filter(tx => {
                      const matchesSearch = !searchQuery || 
                        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        tx.id.toLowerCase().includes(searchQuery.toLowerCase())

                      const matchesTab = tab === 'all' || tx.type === tab

                      return matchesSearch && matchesTab
                    })

                    return tabFilteredTransactions.length === 0 ? (
                      <div className="text-center py-12">
                        <DocumentMagnifyingGlassIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-xl font-medium text-gray-600 mb-2">
                          No transactions found
                        </p>
                        <p className="text-gray-500">
                          {searchQuery ? 'Try adjusting your search criteria' : `No ${tab === 'all' ? '' : tabLabels[tab].toLowerCase()} `}transactions yet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <AnimatePresence>
                          {tabFilteredTransactions.map((transaction, index) => {
                            const typeConfig = transactionTypeConfig[transaction.type]
                            const statusInfo = statusConfig[transaction.status]
                            const TypeIcon = typeConfig.icon
                            const StatusIcon = statusInfo.icon
                            
                            return (
                              <motion.div
                                key={transaction.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.02 }}
                                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 ${typeConfig.bgColor} rounded-xl flex items-center justify-center`}>
                                      <TypeIcon className={`h-6 w-6 ${typeConfig.iconColor}`} />
                                    </div>
                                    
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                          {typeConfig.label}
                                        </h3>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.classes}`}>
                                          <StatusIcon className="h-3 w-3" />
                                          {statusInfo.label}
                                        </span>
                                      </div>
                                      
                                      <div className="flex items-center gap-6 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                          <CalendarIcon className="h-4 w-4" />
                                          <span>{new Date(transaction.created_at).toLocaleString()}</span>
                                        </div>
                                        <div>
                                          <span>ID: {transaction.id.toString().slice(0, 20)}...</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="text-right">
                                    <p className={`text-2xl font-bold ${typeConfig.textColor}`}>
                                      {transaction.type.includes('pkr') ? '₨' : '$'}{transaction.amount.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            )
                          })}
                        </AnimatePresence>
                      </div>
                    )
                  })()}
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </motion.div>
      </div>
    </div>
  )
}
