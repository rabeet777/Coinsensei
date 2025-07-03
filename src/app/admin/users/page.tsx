'use client'

import React, { useState, useEffect, Fragment } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import {
  UserIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  DocumentMagnifyingGlassIcon,
  IdentificationIcon,
  WalletIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'

type User = {
  id: string
  email: string
  created_at: string
  user_profile: {
    full_name: string | null
    phone_number: string | null
    cnic_number: string | null
    kyc_status: 'not_submitted' | 'pending' | 'approved' | 'rejected'
    is_locked: boolean
  }[]
  user_pkr_wallets: {
    total_balance: number
    locked_balance: number
  }[]
  user_wallets: {
    total_balance: number
    trx_balance: number
  }[]
}

const kycStatusConfig = {
  not_submitted: { 
    classes: 'bg-gray-100 text-gray-800 border-gray-200', 
    icon: DocumentMagnifyingGlassIcon, 
    label: 'Not Submitted' 
  },
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
  rejected: { 
    classes: 'bg-red-100 text-red-800 border-red-200', 
    icon: XCircleIcon, 
    label: 'Rejected' 
  },
}

export default function AdminUsersPage() {
  const supabase = createClientComponentClient<Database>()
  
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [kycFilter, setKycFilter] = useState<'all' | 'approved' | 'pending' | 'rejected' | 'not_submitted'>('all')

  // Load users with all related data
  async function loadUsers() {
    setLoading(true)
    setError(null)
    try {
      // First get all user profiles (this is the main table)
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profile')
        .select('uid, full_name, phone_number, cnic_number, kyc_status, is_locked, created_at')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Then get related data for each user
      const usersWithProfile = await Promise.all(
        profilesData.map(async (profile) => {
          // Get PKR wallet
          const { data: pkrWallet } = await supabase
            .from('user_pkr_wallets')
            .select('total_balance, locked_balance')
            .eq('user_id', profile.uid)
            .single()

          // Get USDT wallet
          const { data: usdtWallet } = await supabase
            .from('user_wallets')
            .select('total_balance, trx_balance')
            .eq('user_id', profile.uid)
            .single()

          return {
            id: profile.uid,
            email: profile.uid, // We'll use uid as email for now, you can join with auth.users if needed
            created_at: profile.created_at,
            user_profile: [profile],
            user_pkr_wallets: pkrWallet ? [pkrWallet] : [],
            user_wallets: usdtWallet ? [usdtWallet] : []
          }
        })
      )

      setUsers(usersWithProfile as User[])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // Filter users based on search and KYC status
  const filteredUsers = users.filter(user => {
    const profile = user.user_profile?.[0]
    const matchesSearch = !searchQuery || 
      user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile?.phone_number?.includes(searchQuery) ||
      profile?.cnic_number?.includes(searchQuery)

    const matchesKyc = kycFilter === 'all' || 
      profile?.kyc_status === kycFilter

    return matchesSearch && matchesKyc
  })

  // Calculate statistics
  const stats = {
    total: users.length,
    kycApproved: users.filter(u => u.user_profile?.[0]?.kyc_status === 'approved').length,
    kycPending: users.filter(u => u.user_profile?.[0]?.kyc_status === 'pending').length,
    totalPkrBalance: users.reduce((sum, u) => sum + (u.user_pkr_wallets?.[0]?.total_balance || 0), 0),
    totalUsdtBalance: users.reduce((sum, u) => sum + (u.user_wallets?.[0]?.total_balance || 0), 0),
    newThisMonth: users.filter(u => {
      const created = new Date(u.created_at)
      const now = new Date()
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    }).length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-blue-700 bg-clip-text text-transparent">
                User Management
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Manage and monitor all platform users
              </p>
            </div>
            <div className="flex items-center gap-3">
              <UserGroupIcon className="h-12 w-12 text-blue-600" />
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
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
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
                <p className="text-sm font-medium text-gray-600">KYC Approved</p>
                <p className="text-3xl font-bold text-green-600">{stats.kycApproved}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <ShieldCheckIcon className="h-6 w-6 text-green-600" />
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
                <p className="text-sm font-medium text-gray-600">KYC Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.kycPending}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-xl">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
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
                <p className="text-sm font-medium text-gray-600">New This Month</p>
                <p className="text-3xl font-bold text-purple-600">{stats.newThisMonth}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <CalendarIcon className="h-6 w-6 text-purple-600" />
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
                <p className="text-sm font-medium text-gray-600">Total PKR</p>
                <p className="text-2xl font-bold text-green-600">₨{stats.totalPkrBalance.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <BanknotesIcon className="h-6 w-6 text-green-600" />
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
                <p className="text-2xl font-bold text-blue-600">${stats.totalUsdtBalance.toLocaleString()}</p>
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

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, CNIC, or User ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            
            <select
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[150px]"
            >
              <option value="all">All KYC Status</option>
              <option value="approved">KYC Approved</option>
              <option value="pending">KYC Pending</option>
              <option value="rejected">KYC Rejected</option>
              <option value="not_submitted">No KYC</option>
            </select>

            <button
              onClick={loadUsers}
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

        {/* Users List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Users ({filteredUsers.length})
            </h2>
            <p className="text-gray-600 mt-1">
              Manage user accounts and view detailed information
            </p>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading users...</p>
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl font-medium text-gray-600 mb-2">
                  No users found
                </p>
                <p className="text-gray-500">
                  {searchQuery || kycFilter !== 'all' ? 'Try adjusting your search criteria' : 'No users registered yet'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                <AnimatePresence>
                  {filteredUsers.map((user, index) => {
                    const kycStatus = user.user_profile?.[0]?.kyc_status || 'not_submitted'
                    const StatusIcon = kycStatusConfig[kycStatus].icon
                    
                    return (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-white" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {user.user_profile?.[0]?.full_name || 'No Name Provided'}
                                </h3>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${kycStatusConfig[kycStatus].classes}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {kycStatusConfig[kycStatus].label}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <IdentificationIcon className="h-4 w-4" />
                                  <span>ID: {user.id.toString().slice(0, 8)}...</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <PhoneIcon className="h-4 w-4" />
                                  <span>{user.user_profile?.[0]?.phone_number || 'Not provided'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <BanknotesIcon className="h-4 w-4" />
                                  <span className="font-semibold text-green-600">
                                    PKR ₨{(user.user_pkr_wallets?.[0]?.total_balance || 0).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <WalletIcon className="h-4 w-4" />
                                  <span className="font-semibold text-blue-600">
                                    USDT ${(user.user_wallets?.[0]?.total_balance || 0).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                                <CalendarIcon className="h-4 w-4" />
                                <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                                {user.user_profile?.[0]?.cnic_number && (
                                  <>
                                    <span>•</span>
                                    <IdentificationIcon className="h-4 w-4" />
                                    <span>CNIC: {user.user_profile?.[0]?.cnic_number}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors group-hover:scale-105 transform duration-200"
                            >
                              <EyeIcon className="h-4 w-4" />
                              View Details
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
} 