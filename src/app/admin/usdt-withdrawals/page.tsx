'use client'

import React, { useState, useEffect, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import { Dialog, Transition } from '@headlessui/react'
import {
  BanknotesIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ShieldExclamationIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  EyeIcon,
  XMarkIcon,
  UserIcon,
  LinkIcon,
  WalletIcon,
  ChartBarIcon,
  CogIcon,
  HandRaisedIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline'

type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
type WithdrawalType = 'internal' | 'onchain'

type Withdrawal = {
  id: string
  user_id: string
  to_address: string
  amount: number
  fee: number
  type: WithdrawalType
  status: WithdrawalStatus
  tx_id: string | null
  error_message: string | null
  created_at: string
  updated_at: string
  client_provided_id: string
  user_profile: {
    full_name: string | null
    phone_number: string | null
    kyc_status: string
  } | null
}

type QueueStats = {
  pending: number
  processing: number
  completed: number
  failed: number
  totalVolume: number
  totalFees: number
}

type RiskMetrics = {
  dailyVolume: number
  velocityAlerts: number
  suspiciousTransactions: number
  highValueTransactions: number
}

export default function AdminUSDTWithdrawalsPage() {
  const supabase = createClientComponentClient<Database>()

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | WithdrawalStatus>('all')
  const [filterType, setFilterType] = useState<'all' | WithdrawalType>('all')
  const [queueStats, setQueueStats] = useState<QueueStats>({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    totalVolume: 0,
    totalFees: 0
  })
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics>({
    dailyVolume: 0,
    velocityAlerts: 0,
    suspiciousTransactions: 0,
    highValueTransactions: 0
  })

  // Load withdrawals and stats
  async function loadWithdrawals() {
    setLoading(true)
    setError(null)
    try {
      // Get withdrawals with user profiles
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select(`
          id,
          user_id,
          to_address,
          amount,
          fee,
          type,
          status,
          tx_id,
          error_message,
          created_at,
          updated_at,
          client_provided_id
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (withdrawalsError) throw withdrawalsError

      // Get user profiles separately
      const userIds = withdrawalsData?.map(w => w.user_id) || []
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profile')
        .select('uid, full_name, phone_number, kyc_status')
        .in('uid', userIds)

      if (profilesError) throw profilesError

      // Create profile map
      const profileMap = new Map()
      profilesData?.forEach(profile => {
        profileMap.set(profile.uid, profile)
      })

      // Combine data
      const combinedWithdrawals = withdrawalsData?.map(withdrawal => ({
        ...withdrawal,
        user_profile: profileMap.get(withdrawal.user_id) || null
      })) || []

      setWithdrawals(combinedWithdrawals)

      // Calculate stats
      const stats = calculateStats(combinedWithdrawals)
      setQueueStats(stats)

      // Calculate risk metrics
      const risk = calculateRiskMetrics(combinedWithdrawals)
      setRiskMetrics(risk)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWithdrawals()
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadWithdrawals, 30000)
    return () => clearInterval(interval)
  }, [])

  // Calculate queue statistics
  function calculateStats(withdrawals: Withdrawal[]): QueueStats {
    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      totalVolume: 0,
      totalFees: 0
    }

    withdrawals.forEach(w => {
      stats[w.status as keyof QueueStats]++
      stats.totalVolume += w.amount
      stats.totalFees += w.fee
    })

    return stats
  }

  // Calculate risk metrics
  function calculateRiskMetrics(withdrawals: Withdrawal[]): RiskMetrics {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayWithdrawals = withdrawals.filter(w => 
      new Date(w.created_at) >= today
    )

    const dailyVolume = todayWithdrawals.reduce((sum, w) => sum + w.amount, 0)
    const highValueTransactions = withdrawals.filter(w => w.amount >= 1000).length
    const velocityAlerts = todayWithdrawals.filter(w => w.amount >= 5000).length
    const suspiciousTransactions = withdrawals.filter(w => 
      w.status === 'failed' || w.error_message?.includes('suspicious')
    ).length

    return {
      dailyVolume,
      velocityAlerts,
      suspiciousTransactions,
      highValueTransactions
    }
  }

  // Filter withdrawals
  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    if (!searchQuery && filterStatus === 'all' && filterType === 'all') return true
    
    // Search filter
    let matchesSearch = true
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      matchesSearch = Boolean(
        withdrawal.user_profile?.full_name?.toLowerCase().includes(query) ||
        withdrawal.to_address.toLowerCase().includes(query) ||
        withdrawal.tx_id?.toLowerCase().includes(query) ||
        withdrawal.user_profile?.phone_number?.includes(query) ||
        withdrawal.id.toString().includes(query)
      )
    }
    
    // Status filter
    let matchesStatus = true
    if (filterStatus !== 'all') {
      matchesStatus = withdrawal.status === filterStatus
    }

    // Type filter
    let matchesType = true
    if (filterType !== 'all') {
      matchesType = withdrawal.type === filterType
    }
    
    return matchesSearch && matchesStatus && matchesType
  })

  // Manual withdrawal actions
  async function handleWithdrawalAction(withdrawal: Withdrawal, action: 'approve' | 'reject' | 'retry' | 'cancel') {
    const actionKey = `${withdrawal.id}_${action}`
    setActionLoading(actionKey)
    
    try {
      const response = await fetch('/api/admin/withdrawal-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId: withdrawal.id,
          action: action,
          adminReason: `Manual ${action} by admin`
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} withdrawal`)
      }

      const result = await response.json()
      
      if (result.success) {
        await loadWithdrawals()
        setModalOpen(false)
      } else {
        throw new Error(result.error || `Failed to ${action} withdrawal`)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // Emergency pause/resume system
  async function handleSystemControl(action: 'pause' | 'resume') {
    try {
      const response = await fetch('/api/admin/withdrawal-system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} withdrawal system`)
      }

      // Refresh data
      await loadWithdrawals()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const getStatusIcon = (status: WithdrawalStatus) => {
    switch (status) {
      case 'pending': return <ClockIcon className="h-5 w-5 text-yellow-600" />
      case 'processing': return <ArrowPathIcon className="h-5 w-5 text-blue-600 animate-spin" />
      case 'completed': return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'failed': return <XCircleIcon className="h-5 w-5 text-red-600" />
      case 'cancelled': return <NoSymbolIcon className="h-5 w-5 text-gray-600" />
      default: return <ClockIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: WithdrawalStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && withdrawals.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading withdrawals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BanknotesIcon className="h-8 w-8 text-blue-600" />
                USDT Withdrawal Management
              </h1>
              <p className="text-gray-600 mt-1">
                Monitor and manage USDT withdrawals with real-time controls
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={loadWithdrawals}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowPathIcon className="h-4 w-4" />
                )}
                Refresh
              </button>
              
              <button
                onClick={() => handleSystemControl('pause')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <PauseIcon className="h-4 w-4" />
                Emergency Pause
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{queueStats.pending}</p>
              </div>
              <div className="bg-yellow-100 p-2 rounded-lg">
                <ClockIcon className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-blue-600">{queueStats.processing}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <ArrowPathIcon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{queueStats.completed}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{queueStats.failed}</p>
              </div>
              <div className="bg-red-100 p-2 rounded-lg">
                <XCircleIcon className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Volume</p>
                <p className="text-xl font-bold text-purple-600">${queueStats.totalVolume.toLocaleString()}</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-lg">
                <ChartBarIcon className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Fee Revenue</p>
                <p className="text-xl font-bold text-green-600">${queueStats.totalFees.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Risk Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
            <ShieldExclamationIcon className="h-6 w-6 text-red-600" />
            Risk Management Dashboard
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Daily Volume</h3>
              <p className="text-2xl font-bold text-blue-600">${riskMetrics.dailyVolume.toLocaleString()}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-900">Velocity Alerts</h3>
              <p className="text-2xl font-bold text-yellow-600">{riskMetrics.velocityAlerts}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-900">Suspicious</h3>
              <p className="text-2xl font-bold text-red-600">{riskMetrics.suspiciousTransactions}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">High Value</h3>
              <p className="text-2xl font-bold text-purple-600">{riskMetrics.highValueTransactions}</p>
            </div>
          </div>
        </motion.div>

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
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto text-red-600 hover:text-red-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user, address, transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="internal">Internal</option>
                <option value="onchain">On-Chain</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Withdrawals Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Withdrawals ({filteredWithdrawals.length})
            </h2>
          </div>
          
          {filteredWithdrawals.length === 0 ? (
            <div className="text-center py-12">
              <BanknotesIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl font-medium text-gray-600 mb-2">
                {searchQuery || filterStatus !== 'all' || filterType !== 'all' ? 'No withdrawals found' : 'No withdrawals available'}
              </p>
              <p className="text-gray-500">
                {searchQuery || filterStatus !== 'all' || filterType !== 'all' ? 'Try adjusting your search or filters' : 'Withdrawals will appear here once created'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {filteredWithdrawals.map((withdrawal, index) => (
                      <motion.tr
                        key={withdrawal.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* User Info */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {withdrawal.user_profile?.full_name || 'Unknown User'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {withdrawal.user_profile?.phone_number || 'No phone'}
                              </div>
                              <div className="text-xs text-gray-400">
                                ID: {withdrawal.id.toString().slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            ${withdrawal.amount.toLocaleString()} USDT
                          </div>
                          {withdrawal.fee > 0 && (
                            <div className="text-xs text-gray-500">
                              Fee: ${withdrawal.fee}
                            </div>
                          )}
                        </td>

                        {/* Destination */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">
                            {withdrawal.to_address.slice(0, 8)}...{withdrawal.to_address.slice(-6)}
                          </div>
                          {withdrawal.tx_id && (
                            <div className="text-xs text-blue-600 flex items-center gap-1">
                              <LinkIcon className="h-3 w-3" />
                              TX: {withdrawal.tx_id.slice(0, 8)}...
                            </div>
                          )}
                        </td>

                        {/* Type */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            withdrawal.type === 'internal' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {withdrawal.type === 'internal' ? 'Internal' : 'On-Chain'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(withdrawal.status)}
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                              {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                            </span>
                          </div>
                          {withdrawal.error_message && (
                            <div className="text-xs text-red-600 mt-1">
                              {withdrawal.error_message.slice(0, 30)}...
                            </div>
                          )}
                        </td>

                        {/* Created */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(withdrawal.created_at).toLocaleDateString()}
                          <div className="text-xs">
                            {new Date(withdrawal.created_at).toLocaleTimeString()}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal)
                                setModalOpen(true)
                              }}
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium flex items-center gap-1"
                            >
                              <EyeIcon className="h-3 w-3" />
                              View
                            </button>
                            
                            {withdrawal.status === 'pending' && (
                              <button
                                onClick={() => handleWithdrawalAction(withdrawal, 'approve')}
                                disabled={actionLoading === `${withdrawal.id}_approve`}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                              >
                                {actionLoading === `${withdrawal.id}_approve` ? (
                                  <div className="w-3 h-3 border border-green-600/30 border-t-green-600 rounded-full animate-spin" />
                                ) : (
                                  <CheckCircleIcon className="h-3 w-3" />
                                )}
                                Approve
                              </button>
                            )}
                            
                            {withdrawal.status === 'failed' && (
                              <button
                                onClick={() => handleWithdrawalAction(withdrawal, 'retry')}
                                disabled={actionLoading === `${withdrawal.id}_retry`}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                              >
                                {actionLoading === `${withdrawal.id}_retry` ? (
                                  <div className="w-3 h-3 border border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                                ) : (
                                  <ArrowPathIcon className="h-3 w-3" />
                                )}
                                Retry
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Withdrawal Details Modal */}
      <AnimatePresence>
        {modalOpen && selectedWithdrawal && (
          <Transition appear show={modalOpen} as={Fragment}>
            <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={() => setModalOpen(false)}>
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
              
              <div className="fixed inset-0 flex items-center justify-center p-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        Withdrawal Details
                      </Dialog.Title>
                      <button 
                        onClick={() => setModalOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Basic Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                          <p className="text-lg font-semibold text-gray-900">
                            {selectedWithdrawal.user_profile?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-gray-600">{selectedWithdrawal.user_profile?.phone_number}</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">KYC Status</label>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            selectedWithdrawal.user_profile?.kyc_status === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedWithdrawal.user_profile?.kyc_status || 'unknown'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Transaction Details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                          <p className="text-xl font-bold text-green-600">
                            ${selectedWithdrawal.amount.toLocaleString()} USDT
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fee</label>
                          <p className="text-xl font-bold text-gray-600">
                            ${selectedWithdrawal.fee.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Addresses */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Destination Address</label>
                        <p className="font-mono text-sm bg-gray-100 p-3 rounded-lg break-all">
                          {selectedWithdrawal.to_address}
                        </p>
                      </div>
                      
                      {selectedWithdrawal.tx_id && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Hash</label>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm bg-gray-100 p-3 rounded-lg break-all flex-1">
                              {selectedWithdrawal.tx_id}
                            </p>
                            <button
                              onClick={() => window.open(`https://tronscan.org/#/transaction/${selectedWithdrawal.tx_id}`, '_blank')}
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
                            >
                              View on TronScan
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {selectedWithdrawal.error_message && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Error Message</label>
                          <p className="text-sm bg-red-50 text-red-800 p-3 rounded-lg">
                            {selectedWithdrawal.error_message}
                          </p>
                        </div>
                      )}
                      
                      {/* Timestamps */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                          <p className="text-sm text-gray-600">
                            {new Date(selectedWithdrawal.created_at).toLocaleString()}
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                          <p className="text-sm text-gray-600">
                            {new Date(selectedWithdrawal.updated_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Admin Actions */}
                      <div className="border-t pt-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Admin Actions</h3>
                        <div className="flex gap-3">
                          {selectedWithdrawal.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleWithdrawalAction(selectedWithdrawal, 'approve')}
                                disabled={actionLoading === `${selectedWithdrawal.id}_approve`}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                              >
                                Approve Withdrawal
                              </button>
                              <button
                                onClick={() => handleWithdrawalAction(selectedWithdrawal, 'reject')}
                                disabled={actionLoading === `${selectedWithdrawal.id}_reject`}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                              >
                                Reject Withdrawal
                              </button>
                            </>
                          )}
                          
                          {selectedWithdrawal.status === 'failed' && (
                            <button
                              onClick={() => handleWithdrawalAction(selectedWithdrawal, 'retry')}
                              disabled={actionLoading === `${selectedWithdrawal.id}_retry`}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              Retry Withdrawal
                            </button>
                          )}
                          
                          {['pending', 'processing'].includes(selectedWithdrawal.status) && (
                            <button
                              onClick={() => handleWithdrawalAction(selectedWithdrawal, 'cancel')}
                              disabled={actionLoading === `${selectedWithdrawal.id}_cancel`}
                              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                              Cancel Withdrawal
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </Dialog>
          </Transition>
        )}
      </AnimatePresence>
    </div>
  )
} 