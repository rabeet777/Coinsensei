'use client'

import React, { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  WalletIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ChartBarIcon,
  BanknotesIcon,
  UserIcon,
  LockClosedIcon,
  LockOpenIcon,
  EyeIcon,
  PlusIcon,
  MinusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { Dialog, Transition } from '@headlessui/react'

interface PKRWallet {
  id: string
  user_id: string
  address: string | null
  created_at: string
  balance: number
  locked_balance: number
  total_balance: number
  user_profile: {
    full_name: string | null
    phone_number: string | null
    kyc_status: string
    is_locked: boolean
  } | null
}

interface WalletStats {
  totalWallets: number
  totalBalance: number
  totalLockedBalance: number
  averageBalance: number
  activeWallets: number
  emptyWallets: number
  lockedWallets: number
}

export default function AdminPKRWalletsPage() {
  const supabase = createClientComponentClient()
  
  const [wallets, setWallets] = useState<PKRWallet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWallet, setSelectedWallet] = useState<PKRWallet | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [balanceAdjustment, setBalanceAdjustment] = useState<number>(0)
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [stats, setStats] = useState<WalletStats>({
    totalWallets: 0,
    totalBalance: 0,
    totalLockedBalance: 0,
    averageBalance: 0,
    activeWallets: 0,
    emptyWallets: 0,
    lockedWallets: 0
  })

  // Filters
  const [filterBalance, setFilterBalance] = useState<'all' | 'empty' | 'low' | 'high'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'locked'>('all')
  const [filterKYC, setFilterKYC] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all')

  // Load wallets and user profiles
  async function loadWallets() {
    setLoading(true)
    setError(null)
    
    try {
      // Get PKR wallets with user profiles
      const { data: walletsData, error: walletsError } = await supabase
        .from('user_pkr_wallets')
        .select(`
          id,
          user_id,
          address,
          created_at,
          balance,
          locked_balance,
          total_balance
        `)
        .order('total_balance', { ascending: false })

      if (walletsError) throw walletsError

      // Get user profiles separately
      const userIds = walletsData?.map(w => w.user_id) || []
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profile')
        .select('uid, full_name, phone_number, kyc_status, is_locked')
        .in('uid', userIds)

      if (profilesError) throw profilesError

      // Create profile map
      const profileMap = new Map()
      profilesData?.forEach(profile => {
        profileMap.set(profile.uid, profile)
      })

      // Combine data
      const combinedWallets = walletsData?.map(wallet => ({
        ...wallet,
        user_profile: profileMap.get(wallet.user_id) || null
      })) || []

      setWallets(combinedWallets)
      calculateStats(combinedWallets)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Calculate wallet statistics
  function calculateStats(wallets: PKRWallet[]) {
    const totalWallets = wallets.length
    const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0)
    const totalLockedBalance = wallets.reduce((sum, w) => sum + Number(w.locked_balance), 0)
    const averageBalance = totalWallets > 0 ? totalBalance / totalWallets : 0
    const activeWallets = wallets.filter(w => Number(w.total_balance) > 0).length
    const emptyWallets = wallets.filter(w => Number(w.total_balance) === 0).length
    const lockedWallets = wallets.filter(w => w.user_profile?.is_locked).length

    setStats({
      totalWallets,
      totalBalance,
      totalLockedBalance,
      averageBalance,
      activeWallets,
      emptyWallets,
      lockedWallets
    })
  }

  // Filter wallets based on search and filters
  const filteredWallets = wallets.filter(wallet => {
    // Search filter
    const searchMatch = !searchQuery || 
      wallet.user_profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wallet.user_profile?.phone_number?.includes(searchQuery) ||
      wallet.user_id.toLowerCase().includes(searchQuery.toLowerCase())

    // Balance filter
    const balanceMatch = filterBalance === 'all' || 
      (filterBalance === 'empty' && Number(wallet.total_balance) === 0) ||
      (filterBalance === 'low' && Number(wallet.total_balance) > 0 && Number(wallet.total_balance) < 1000) ||
      (filterBalance === 'high' && Number(wallet.total_balance) >= 10000)

    // Status filter
    const statusMatch = filterStatus === 'all' ||
      (filterStatus === 'active' && !wallet.user_profile?.is_locked) ||
      (filterStatus === 'locked' && wallet.user_profile?.is_locked)

    // KYC filter
    const kycMatch = filterKYC === 'all' ||
      wallet.user_profile?.kyc_status === filterKYC

    return searchMatch && balanceMatch && statusMatch && kycMatch
  })

  // Adjust wallet balance
  async function adjustBalance(wallet: PKRWallet, amount: number, reason: string) {
    setActionLoading(`adjust_${wallet.id}`)
    
    try {
      const newBalance = Number(wallet.balance) + amount
      
      if (newBalance < 0) {
        throw new Error('Balance cannot be negative')
      }

      const { error } = await supabase
        .from('user_pkr_wallets')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id)

      if (error) throw error

      // Log the adjustment
      await supabase
        .from('admin_actions')
        .insert({
          admin_user_id: 'current_admin', // Replace with actual admin ID
          action_type: 'balance_adjustment',
          target_id: wallet.id,
          target_type: 'pkr_wallet',
          details: {
            wallet_id: wallet.id,
            user_id: wallet.user_id,
            amount: amount,
            old_balance: wallet.balance,
            new_balance: newBalance,
            reason: reason
          },
          created_at: new Date().toISOString()
        })

      await loadWallets()
      setModalOpen(false)
      setBalanceAdjustment(0)
      setAdjustmentReason('')
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // Lock/Unlock user account
  async function toggleUserLock(wallet: PKRWallet) {
    setActionLoading(`lock_${wallet.id}`)
    
    try {
      const newLockStatus = !wallet.user_profile?.is_locked
      
      const { error } = await supabase
        .from('user_profile')
        .update({ is_locked: newLockStatus })
        .eq('uid', wallet.user_id)

      if (error) throw error

      // Log the action
      await supabase
        .from('admin_actions')
        .insert({
          admin_user_id: 'current_admin',
          action_type: newLockStatus ? 'user_lock' : 'user_unlock',
          target_id: wallet.user_id,
          target_type: 'user',
          details: {
            user_id: wallet.user_id,
            wallet_id: wallet.id,
            action: newLockStatus ? 'locked' : 'unlocked'
          },
          created_at: new Date().toISOString()
        })

      await loadWallets()
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  useEffect(() => {
    loadWallets()
  }, [])

  if (loading && wallets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PKR wallets...</p>
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
                PKR Wallet Management
              </h1>
              <p className="text-gray-600 mt-1">
                Monitor and manage user PKR wallets with comprehensive controls
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
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Wallets</p>
                    <p className="text-3xl font-bold">{stats.totalWallets.toLocaleString()}</p>
                  </div>
                  <WalletIcon className="h-8 w-8 text-blue-200" />
                </div>
                <div className="mt-4 text-sm text-blue-100">
                  Active: {stats.activeWallets} | Empty: {stats.emptyWallets}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-r from-green-600 to-green-700 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Total Balance</p>
                    <p className="text-3xl font-bold">₨{stats.totalBalance.toLocaleString()}</p>
                  </div>
                  <BanknotesIcon className="h-8 w-8 text-green-200" />
                </div>
                <div className="mt-4 text-sm text-green-100">
                  Available: ₨{(stats.totalBalance - stats.totalLockedBalance).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-r from-yellow-600 to-yellow-700 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm">Locked Balance</p>
                    <p className="text-3xl font-bold">₨{stats.totalLockedBalance.toLocaleString()}</p>
                  </div>
                  <LockClosedIcon className="h-8 w-8 text-yellow-200" />
                </div>
                <div className="mt-4 text-sm text-yellow-100">
                  Locked Users: {stats.lockedWallets}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Average Balance</p>
                    <p className="text-3xl font-bold">₨{stats.averageBalance.toLocaleString()}</p>
                  </div>
                  <ChartBarIcon className="h-8 w-8 text-purple-200" />
                </div>
                <div className="mt-4 text-sm text-purple-100">
                  Per wallet average
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, phone, or user ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={filterBalance}
                onChange={(e) => setFilterBalance(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Balances</option>
                <option value="empty">Empty (₨0)</option>
                <option value="low">Low (₨0-1K)</option>
                <option value="high">High (₨10K+)</option>
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="locked">Locked</option>
              </select>
              
              <select
                value={filterKYC}
                onChange={(e) => setFilterKYC(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All KYC</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <span className="font-medium">{error}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Wallets Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              PKR Wallets ({filteredWallets.length})
            </h2>
          </div>
          
          {filteredWallets.length === 0 ? (
            <div className="text-center py-12">
              <WalletIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl font-medium text-gray-600 mb-2">
                {searchQuery || filterBalance !== 'all' || filterStatus !== 'all' || filterKYC !== 'all' ? 'No wallets found' : 'No wallets available'}
              </p>
              <p className="text-gray-500">
                {searchQuery || filterBalance !== 'all' || filterStatus !== 'all' || filterKYC !== 'all' ? 'Try adjusting your search or filters' : 'PKR wallets will appear here once users are created'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KYC</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
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
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        {/* User */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-blue-100 p-2 rounded-full mr-3">
                              <UserIcon className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {wallet.user_profile?.full_name || 'Unknown User'}
                              </div>
                              <div className="text-xs text-gray-400">
                                ID: {wallet.user_id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Balance */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-semibold text-gray-900">
                              ₨{Number(wallet.total_balance).toLocaleString()}
                            </div>
                            <div className="text-gray-500">
                              Available: ₨{Number(wallet.balance).toLocaleString()}
                            </div>
                            {Number(wallet.locked_balance) > 0 && (
                              <div className="text-red-600 text-xs">
                                Locked: ₨{Number(wallet.locked_balance).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {wallet.user_profile?.is_locked ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <LockClosedIcon className="h-3 w-3 mr-1" />
                                Locked
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <LockOpenIcon className="h-3 w-3 mr-1" />
                                Active
                              </span>
                            )}
                          </div>
                        </td>

                        {/* KYC */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            wallet.user_profile?.kyc_status === 'verified' 
                              ? 'bg-green-100 text-green-800' 
                              : wallet.user_profile?.kyc_status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {wallet.user_profile?.kyc_status || 'Unknown'}
                          </span>
                        </td>

                        {/* Created */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(wallet.created_at).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedWallet(wallet)
                                setModalOpen(true)
                              }}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs font-medium flex items-center gap-1"
                            >
                              <EyeIcon className="h-3 w-3" />
                              Manage
                            </button>
                            
                            <button
                              onClick={() => toggleUserLock(wallet)}
                              disabled={actionLoading === `lock_${wallet.id}`}
                              className={`px-3 py-1 rounded-lg transition-colors text-xs font-medium disabled:opacity-50 flex items-center gap-1 ${
                                wallet.user_profile?.is_locked
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                            >
                              {actionLoading === `lock_${wallet.id}` ? (
                                <div className="w-3 h-3 border border-gray-600/30 border-t-gray-600 rounded-full animate-spin" />
                              ) : wallet.user_profile?.is_locked ? (
                                <LockOpenIcon className="h-3 w-3" />
                              ) : (
                                <LockClosedIcon className="h-3 w-3" />
                              )}
                              {wallet.user_profile?.is_locked ? 'Unlock' : 'Lock'}
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

      {/* Wallet Management Modal */}
      <Transition appear show={modalOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setModalOpen(false)}>
          <Transition.Child
            as={React.Fragment}
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
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    Manage PKR Wallet
                  </Dialog.Title>

                  {selectedWallet && (
                    <div className="space-y-6">
                      {/* User Info */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">User Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Name:</span>
                            <p className="font-medium">{selectedWallet.user_profile?.full_name || 'Unknown'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Phone:</span>
                            <p className="font-medium">{selectedWallet.user_profile?.phone_number || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">User ID:</span>
                            <p className="font-medium font-mono text-xs">{selectedWallet.user_id}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">KYC Status:</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              selectedWallet.user_profile?.kyc_status === 'verified' 
                                ? 'bg-green-100 text-green-800' 
                                : selectedWallet.user_profile?.kyc_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {selectedWallet.user_profile?.kyc_status || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Balance Info */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">Wallet Balance</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-blue-600">Available:</span>
                            <p className="text-xl font-bold text-blue-900">₨{Number(selectedWallet.balance).toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-yellow-600">Locked:</span>
                            <p className="text-xl font-bold text-yellow-900">₨{Number(selectedWallet.locked_balance).toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-green-600">Total:</span>
                            <p className="text-xl font-bold text-green-900">₨{Number(selectedWallet.total_balance).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Balance Adjustment */}
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-yellow-900 mb-3">Adjust Balance</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Adjustment Amount (₨)
                            </label>
                            <input
                              type="number"
                              value={balanceAdjustment || ''}
                              onChange={(e) => setBalanceAdjustment(Number(e.target.value))}
                              placeholder="Enter positive or negative amount"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Positive values add funds, negative values deduct funds
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Reason for Adjustment
                            </label>
                            <textarea
                              value={adjustmentReason}
                              onChange={(e) => setAdjustmentReason(e.target.value)}
                              placeholder="Explain why you're adjusting the balance..."
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => adjustBalance(selectedWallet, balanceAdjustment, adjustmentReason)}
                              disabled={!balanceAdjustment || !adjustmentReason || actionLoading === `adjust_${selectedWallet.id}`}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {actionLoading === `adjust_${selectedWallet.id}` ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <CheckCircleIcon className="h-4 w-4" />
                              )}
                              Apply Adjustment
                            </button>
                          </div>

                          {balanceAdjustment !== 0 && adjustmentReason && (
                            <div className="bg-white p-3 rounded border">
                              <p className="text-sm text-gray-600">
                                Preview: Balance will change from ₨{Number(selectedWallet.balance).toLocaleString()} to{' '}
                                <span className={`font-semibold ${
                                  Number(selectedWallet.balance) + balanceAdjustment >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  ₨{(Number(selectedWallet.balance) + balanceAdjustment).toLocaleString()}
                                </span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setModalOpen(false)}
                          className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
} 