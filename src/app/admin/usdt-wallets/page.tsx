'use client'

import React, { useState, useEffect, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import { Dialog, Transition } from '@headlessui/react'
import {
  WalletIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  UserIcon,
  CheckCircleIcon,
  BanknotesIcon,
  DocumentTextIcon,
  XMarkIcon,
  CogIcon
} from '@heroicons/react/24/outline'

type UserWallet = {
  id: string
  user_id: string
  address: string
  balance: number
  on_chain_balance: number
  locked_balance: number
  total_balance: number
  trx_balance: number
  needs_consolidation: boolean
  needs_gas: boolean
  is_processing: boolean
  last_sync_at: string | null
  created_at: string
  user_profile: {
    full_name: string | null
    phone_number: string | null
    kyc_status: string
  } | null
}

export default function AdminUSDTWalletsPage() {
  const supabase = createClientComponentClient<Database>()

  const [wallets, setWallets] = useState<UserWallet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWallet, setSelectedWallet] = useState<UserWallet | null>(null)
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [walletActionRunning, setWalletActionRunning] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'needs_attention' | 'needs_consolidation' | 'needs_gas'>('all')

  // Load all user wallets
  async function loadWallets() {
    setLoading(true)
    setError(null)
    try {
      // Get all user wallets first
      const { data: walletsData, error: walletsError } = await supabase
        .from('user_wallets')
        .select('id, user_id, address, balance, on_chain_balance, locked_balance, total_balance, trx_balance, needs_consolidation, needs_gas, is_processing, last_sync_at, created_at')
        .order('created_at', { ascending: false })

      if (walletsError) throw walletsError

      // Get all user profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profile')
        .select('uid, full_name, phone_number, kyc_status')

      if (profilesError) throw profilesError

      // Create a map of user profiles for quick lookup
      const profileMap = new Map()
      profilesData?.forEach(profile => {
        profileMap.set(profile.uid, profile)
      })

      // Combine wallet data with user profiles
      const combinedWallets = walletsData?.map(wallet => ({
        ...wallet,
        user_profile: profileMap.get(wallet.user_id) || null
      })) || []

      setWallets(combinedWallets)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWallets()
  }, [])

  // Filter wallets
  const filteredWallets = wallets.filter(wallet => {
    if (!searchQuery && filterStatus === 'all') return true
    
    // Search filter
    let matchesSearch = true
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      matchesSearch = Boolean(
        wallet.user_profile?.full_name?.toLowerCase().includes(query) ||
        wallet.address.toLowerCase().includes(query) ||
        wallet.user_id.toLowerCase().includes(query) ||
        wallet.user_profile?.phone_number?.includes(query)
      )
    }
    
    // Status filter
    let matchesStatus = true
    if (filterStatus === 'needs_attention') {
      matchesStatus = (wallet.needs_consolidation === true) || (wallet.needs_gas === true)
    } else if (filterStatus === 'needs_consolidation') {
      matchesStatus = wallet.needs_consolidation === true
    } else if (filterStatus === 'needs_gas') {
      matchesStatus = wallet.needs_gas === true
    }
    
    return matchesSearch && matchesStatus
  })

  // Calculate statistics
  const stats = {
    totalWallets: wallets.length,
    totalBalance: wallets.reduce((sum, w) => sum + w.balance, 0),
    totalOnChainBalance: wallets.reduce((sum, w) => sum + w.on_chain_balance, 0),
    totalLockedBalance: wallets.reduce((sum, w) => sum + w.locked_balance, 0),
    totalTRXBalance: wallets.reduce((sum, w) => sum + w.trx_balance, 0),
    walletsWithBalance: wallets.filter(w => w.total_balance > 0).length,
    needsConsolidation: wallets.filter(w => w.needs_consolidation === true).length,
    needsGas: wallets.filter(w => w.needs_gas === true).length,
    needsAttention: wallets.filter(w => w.needs_consolidation === true || w.needs_gas === true).length,
    processingWallets: wallets.filter(w => w.is_processing === true).length,
    averageBalance: wallets.length > 0 ? wallets.reduce((sum, w) => sum + w.total_balance, 0) / wallets.length : 0
  }

  // Trigger job for specific wallet
  async function triggerWalletJob(wallet: UserWallet, jobType: 'sync' | 'consolidation' | 'gas-topup') {
    const actionKey = `${wallet.id}_${jobType}`
    setWalletActionRunning(actionKey)
    try {
      const response = await fetch(`/api/admin/dispatch-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          walletId: wallet.id, 
          userId: wallet.user_id,
          address: wallet.address,
          jobType: jobType
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to dispatch ${jobType} job for wallet`)
      }

      const result = await response.json()
      
      // Refresh wallets after job dispatch
      if (result.success) {
        await loadWallets()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setWalletActionRunning(null)
    }
  }

  // Reset wallet processing state
  async function resetWalletProcessing(wallet: UserWallet) {
    try {
      const { error } = await supabase
        .from('user_wallets')
        .update({ is_processing: false })
        .eq('id', wallet.id)

      if (error) {
        throw error
      }

      // Refresh wallets to show updated state
      await loadWallets()
    } catch (err: any) {
      setError(`Failed to reset processing state: ${err.message}`)
    }
  }

  // Reset all processing states
  async function resetAllProcessing() {
    try {
      const response = await fetch('/api/admin/reset-processing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to reset processing states')
      }

      const result = await response.json()
      
      // Refresh wallets to show updated state
      await loadWallets()
    } catch (err: any) {
      setError(`Failed to reset all processing: ${err.message}`)
    }
  }

  const openWalletModal = (wallet: UserWallet) => {
    setSelectedWallet(wallet)
    setWalletModalOpen(true)
  }

  if (loading && wallets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallets...</p>
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
                <WalletIcon className="h-8 w-8 text-blue-600" />
                USDT Wallet Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage all user USDT wallets and trigger system jobs
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={loadWallets}
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
                onClick={resetAllProcessing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <XMarkIcon className="h-4 w-4" />
                Reset All Processing
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Wallets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalWallets}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <WalletIcon className="h-5 w-5 text-blue-600" />
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
                <p className="text-xs font-medium text-gray-600">Total Balance</p>
                <p className="text-xl font-bold text-green-600">${stats.totalBalance.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
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
                <p className="text-xs font-medium text-gray-600">On-Chain</p>
                <p className="text-xl font-bold text-blue-600">${stats.totalOnChainBalance.toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-blue-600" />
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
                <p className="text-xs font-medium text-gray-600">Total TRX</p>
                <p className="text-xl font-bold text-purple-600">{stats.totalTRXBalance.toLocaleString()}</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-lg">
                <BanknotesIcon className="h-5 w-5 text-purple-600" />
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
                <p className="text-xs font-medium text-gray-600">Needs Attention</p>
                <p className="text-2xl font-bold text-red-600">{stats.needsAttention}</p>
              </div>
              <div className="bg-red-100 p-2 rounded-lg">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
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
                <p className="text-xs font-medium text-gray-600">Needs Consolidation</p>
                <p className="text-2xl font-bold text-orange-600">{stats.needsConsolidation}</p>
              </div>
              <div className="bg-orange-100 p-2 rounded-lg">
                <ArrowPathIcon className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Needs Gas</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.needsGas}</p>
              </div>
              <div className="bg-yellow-100 p-2 rounded-lg">
                <CurrencyDollarIcon className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Job Triggers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
            <CogIcon className="h-6 w-6 text-gray-600" />
            Individual Wallet Jobs
          </h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Available Actions:</strong> You can trigger individual wallet jobs using the action buttons in the table below.
            </p>
            <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
              <li><strong>Sync:</strong> Update wallet balance from blockchain</li>
              <li><strong>Consolidation:</strong> Consolidate tokens to main balance (only when needed)</li>
              <li><strong>Gas Topup:</strong> Add TRX for transaction fees (only when needed)</li>
            </ul>
            <p className="text-xs text-blue-600 mt-2">
              All jobs are logged in the job_logs table and processed by your existing workers.
            </p>
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
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, address, phone, or user ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All Wallets', count: stats.totalWallets },
                { key: 'needs_attention', label: 'Needs Attention', count: stats.needsAttention },
                { key: 'needs_consolidation', label: 'Needs Consolidation', count: stats.needsConsolidation },
                { key: 'needs_gas', label: 'Needs Gas', count: stats.needsGas }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setFilterStatus(filter.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === filter.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                  {filter.count > 0 && (
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      filterStatus === filter.key
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {filter.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Wallets Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              User Wallets ({filteredWallets.length})
            </h2>
          </div>
          
          {filteredWallets.length === 0 ? (
            <div className="text-center py-12">
              <WalletIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl font-medium text-gray-600 mb-2">
                {searchQuery || filterStatus !== 'all' ? 'No wallets found' : 'No wallets available'}
              </p>
              <p className="text-gray-500">
                {searchQuery || filterStatus !== 'all' ? 'Try adjusting your search or filters' : 'Wallets will appear here once created'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Locked</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">On-Chain</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TRX</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Needs Consolidation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Needs Gas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {filteredWallets.map((wallet, index) => (
                      <motion.tr
                        key={wallet.id}
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
                                {wallet.user_profile?.full_name || 'Unknown User'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {wallet.user_profile?.phone_number || 'No phone'}
                              </div>
                              <div className="text-xs text-gray-400">
                                {wallet.user_id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Wallet Address */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900 cursor-pointer" 
                               onClick={() => navigator.clipboard.writeText(wallet.address)}
                               title="Click to copy">
                            {wallet.address.slice(0, 12)}...{wallet.address.slice(-6)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(wallet.created_at).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Balance */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            ${wallet.balance.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            Total: ${wallet.total_balance.toLocaleString()}
                          </div>
                        </td>

                        {/* Locked Balance */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-purple-600">
                            ${wallet.locked_balance.toLocaleString()}
                          </div>
                        </td>

                        {/* On-Chain Balance */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-blue-600">
                            ${wallet.on_chain_balance.toLocaleString()}
                          </div>
                        </td>

                        {/* TRX Balance */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-purple-600">
                            {wallet.trx_balance.toLocaleString()} TRX
                          </div>
                        </td>

                        {/* Needs Consolidation */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-orange-600">
                            {wallet.needs_consolidation ? 'Yes' : 'No'}
                          </div>
                        </td>

                        {/* Needs Gas */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-yellow-600">
                            {wallet.needs_gas ? 'Yes' : 'No'}
                          </div>
                        </td>

                        {/* Status Indicators */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              wallet.user_profile?.kyc_status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : wallet.user_profile?.kyc_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              KYC: {wallet.user_profile?.kyc_status || 'unknown'}
                            </span>
                            
                            {wallet.is_processing === true && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <div className="w-2 h-2 border border-blue-600/30 border-t-blue-600 rounded-full animate-spin mr-1" />
                                Processing
                              </span>
                            )}
                            
                            {wallet.needs_consolidation === true && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                Needs Consolidation
                              </span>
                            )}
                            
                            {wallet.needs_gas === true && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Needs Gas
                              </span>
                            )}
                            
                            {wallet.last_sync_at && (
                              <div className="text-xs text-gray-500">
                                Last sync: {new Date(wallet.last_sync_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2 flex-wrap">
                            {/* Always show Sync button */}
                            <button
                              onClick={() => triggerWalletJob(wallet, 'sync')}
                              disabled={wallet.is_processing || walletActionRunning === `${wallet.id}_sync`}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                            >
                              {walletActionRunning === `${wallet.id}_sync` ? (
                                <div className="w-3 h-3 border border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                              ) : (
                                <ArrowPathIcon className="h-3 w-3" />
                              )}
                              Sync
                            </button>

                            {/* Show Consolidation button when needs_consolidation is true */}
                            {wallet.needs_consolidation === true && (
                              <button
                                onClick={() => triggerWalletJob(wallet, 'consolidation')}
                                disabled={wallet.is_processing || walletActionRunning === `${wallet.id}_consolidation`}
                                className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                              >
                                {walletActionRunning === `${wallet.id}_consolidation` ? (
                                  <div className="w-3 h-3 border border-orange-600/30 border-t-orange-600 rounded-full animate-spin" />
                                ) : (
                                  <ArrowPathIcon className="h-3 w-3" />
                                )}
                                Consolidation
                              </button>
                            )}
                            
                            {/* Show Gas Topup button when needs_gas is true */}
                            {wallet.needs_gas === true && (
                              <button
                                onClick={() => triggerWalletJob(wallet, 'gas-topup')}
                                disabled={wallet.is_processing || walletActionRunning === `${wallet.id}_gas-topup`}
                                className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                              >
                                {walletActionRunning === `${wallet.id}_gas-topup` ? (
                                  <div className="w-3 h-3 border border-yellow-600/30 border-t-yellow-600 rounded-full animate-spin" />
                                ) : (
                                  <CurrencyDollarIcon className="h-3 w-3" />
                                )}
                                Gas Topup
                              </button>
                            )}
                            
                            {/* Reset Processing button - only show when wallet is stuck in processing */}
                            {wallet.is_processing && (
                              <button
                                onClick={() => resetWalletProcessing(wallet)}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-medium flex items-center gap-1"
                                title="Reset processing state"
                              >
                                <XMarkIcon className="h-3 w-3" />
                                Reset
                              </button>
                            )}
                            
                            <button
                              onClick={() => openWalletModal(wallet)}
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium flex items-center gap-1"
                            >
                              <DocumentTextIcon className="h-3 w-3" />
                              Details
                            </button>
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

      {/* Wallet Details Modal */}
      <AnimatePresence>
        {walletModalOpen && selectedWallet && (
          <Transition appear show={walletModalOpen} as={Fragment}>
            <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={() => setWalletModalOpen(false)}>
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
                  <Dialog.Panel className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        Wallet Details
                      </Dialog.Title>
                      <button 
                        onClick={() => setWalletModalOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedWallet.user_profile?.full_name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-600">{selectedWallet.user_id}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Address</label>
                        <p className="font-mono text-sm bg-gray-100 p-3 rounded-lg break-all">
                          {selectedWallet.address}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">USDT Balance</label>
                          <p className="text-xl font-bold text-green-600">
                            ${selectedWallet.total_balance.toLocaleString()}
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">TRX Balance</label>
                          <p className="text-xl font-bold text-purple-600">
                            {selectedWallet.trx_balance.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                        <p className="text-sm text-gray-600">
                          {new Date(selectedWallet.created_at).toLocaleString()}
                        </p>
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