'use client'

import React, { useState, useEffect, Fragment } from 'react'
import { Dialog, Transition, Tab } from '@headlessui/react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import type { Database } from '@/lib/database.types'
import {
  CurrencyDollarIcon,
  XMarkIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  DocumentMagnifyingGlassIcon,
  ChartBarIcon,
  HashtagIcon,
  IdentificationIcon,
  EyeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  LinkIcon,
  WalletIcon,
  ArrowDownIcon,
  BanknotesIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

type USDTDeposit = {
  tx_id: string
  user_id: string
  amount: number
  received_at: string
  created_at: string | null
  user_profile: {
    full_name: string | null
    phone_number: string | null
    kyc_status: string
  } | null
}

const tabs = ['all', 'today', 'week', 'month'] as const
type TabType = typeof tabs[number]

export default function AdminUSDTDepositsPage() {
  const supabase = createClientComponentClient<Database>()

  const [deposits, setDeposits] = useState<USDTDeposit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDeposit, setSelectedDeposit] = useState<USDTDeposit | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [currentTab, setCurrentTab] = useState<TabType>('all')

  // Load USDT deposits with user profiles
  async function loadDeposits() {
    setLoading(true)
    setError(null)
    try {
      // Get deposits from processed_txs table
      const { data: depositsData, error: depositsError } = await supabase
        .from('processed_txs')
        .select('tx_id, user_id, amount, received_at, created_at')
        .order('received_at', { ascending: false })
        .limit(500)

      if (depositsError) throw depositsError

      // Get user profiles separately
      const userIds = depositsData?.map(d => d.user_id) || []
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
      const combinedDeposits = depositsData?.map(deposit => ({
        ...deposit,
        user_profile: profileMap.get(deposit.user_id) || null
      })) || []

      setDeposits(combinedDeposits)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDeposits()
  }, [])

  // Open deposit details modal
  function openDetails(deposit: USDTDeposit) {
    setSelectedDeposit(deposit)
    setModalOpen(true)
  }

  function closeDetails() {
    setModalOpen(false)
    setSelectedDeposit(null)
  }

  // Filter deposits based on search query and time period
  const filteredDeposits = deposits.filter(deposit => {
    // Search filter
    let matchesSearch = true
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      matchesSearch = Boolean(
        deposit.tx_id.toLowerCase().includes(query) ||
        deposit.user_profile?.full_name?.toLowerCase().includes(query) ||
        deposit.user_profile?.phone_number?.includes(query) ||
        deposit.amount.toString().includes(query) ||
        deposit.user_id.toLowerCase().includes(query)
      )
    }

    // Time filter
    let matchesTime = true
    if (currentTab !== 'all') {
      const depositDate = new Date(deposit.received_at)
      const now = new Date()
      
      switch (currentTab) {
        case 'today':
          matchesTime = depositDate.toDateString() === now.toDateString()
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesTime = depositDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesTime = depositDate >= monthAgo
          break
        default:
          matchesTime = true
      }
    }

    return matchesSearch && matchesTime
  })

  // Calculate statistics
  const stats = {
    total: deposits.length,
    totalAmount: deposits.reduce((sum, d) => sum + d.amount, 0),
    todayCount: deposits.filter(d => new Date(d.received_at).toDateString() === new Date().toDateString()).length,
    todayAmount: deposits
      .filter(d => new Date(d.received_at).toDateString() === new Date().toDateString())
      .reduce((sum, d) => sum + d.amount, 0),
    weekCount: deposits.filter(d => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return new Date(d.received_at) >= weekAgo
    }).length,
    weekAmount: deposits
      .filter(d => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return new Date(d.received_at) >= weekAgo
      })
      .reduce((sum, d) => sum + d.amount, 0),
    uniqueUsers: new Set(deposits.map(d => d.user_id)).size,
    averageDeposit: deposits.length > 0 ? deposits.reduce((sum, d) => sum + d.amount, 0) / deposits.length : 0
  }

  const tabLabels: Record<TabType, string> = {
    all: 'All Deposits',
    today: 'Today',
    week: 'This Week',
    month: 'This Month'
  }

  const getTabCount = (tab: TabType) => {
    switch (tab) {
      case 'all': return deposits.length
      case 'today': return stats.todayCount
      case 'week': return stats.weekCount
      case 'month': return deposits.filter(d => {
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        return new Date(d.received_at) >= monthAgo
      }).length
      default: return 0
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 bg-clip-text text-transparent">
                USDT Deposits
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Monitor and manage on-chain USDT deposit transactions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <CurrencyDollarIcon className="h-12 w-12 text-blue-600" />
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
                <p className="text-sm font-medium text-gray-600">Total Deposits</p>
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
                <p className="text-sm font-medium text-gray-600">Total Volume</p>
                <p className="text-2xl font-bold text-blue-600">${stats.totalAmount.toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
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
                <p className="text-sm font-medium text-gray-600">Today's Deposits</p>
                <p className="text-3xl font-bold text-green-600">{stats.todayCount}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <ArrowDownIcon className="h-6 w-6 text-green-600" />
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
                <p className="text-sm font-medium text-gray-600">Today's Volume</p>
                <p className="text-2xl font-bold text-green-600">${stats.todayAmount.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <BanknotesIcon className="h-6 w-6 text-green-600" />
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
                <p className="text-sm font-medium text-gray-600">Unique Users</p>
                <p className="text-3xl font-bold text-purple-600">{stats.uniqueUsers}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <UserIcon className="h-6 w-6 text-purple-600" />
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
                <p className="text-sm font-medium text-gray-600">Average Deposit</p>
                <p className="text-2xl font-bold text-orange-600">${stats.averageDeposit.toFixed(2)}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-xl">
                <ChartBarIcon className="h-6 w-6 text-orange-600" />
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
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by transaction ID, user name, phone, or amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              onClick={loadDeposits}
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

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <Tab.Group 
            selectedIndex={tabs.indexOf(currentTab)} 
            onChange={i => setCurrentTab(tabs[i])}
          >
            <div className="border-b border-gray-200">
              <Tab.List className="flex">
                {tabs.map((tab) => {
                  const count = getTabCount(tab)
                  
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
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading deposits...</p>
                      </div>
                    </div>
                  ) : filteredDeposits.length === 0 ? (
                    <div className="text-center py-12">
                      <DocumentMagnifyingGlassIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-xl font-medium text-gray-600 mb-2">
                        No deposits found
                      </p>
                      <p className="text-gray-500">
                        {searchQuery ? 'Try adjusting your search criteria' : `No deposits for ${tabLabels[tab].toLowerCase()}`}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      <AnimatePresence>
                        {filteredDeposits.map((deposit, index) => (
                          <motion.div
                            key={deposit.tx_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.02 }}
                            className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                  <ArrowDownIcon className="h-6 w-6 text-white" />
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                      {deposit.user_profile?.full_name || 'Unknown User'}
                                    </h3>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">
                                      <CheckCircleIcon className="h-3 w-3" />
                                      CONFIRMED
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                      <HashtagIcon className="h-4 w-4" />
                                      <span className="font-mono">TX: {deposit.tx_id.slice(0, 8)}...{deposit.tx_id.slice(-6)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <CurrencyDollarIcon className="h-4 w-4" />
                                      <span className="font-semibold text-blue-600">${deposit.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <CalendarIcon className="h-4 w-4" />
                                      <span>{new Date(deposit.received_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <ClockIcon className="h-4 w-4" />
                                      <span>{new Date(deposit.received_at).toLocaleTimeString()}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                                    <UserIcon className="h-4 w-4" />
                                    <span>User ID: {deposit.user_id.slice(0, 8)}...</span>
                                    {deposit.user_profile?.phone_number && (
                                      <>
                                        <span>•</span>
                                        <span>{deposit.user_profile.phone_number}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="text-xs text-gray-500">
                                    KYC: {deposit.user_profile?.kyc_status || 'Unknown'}
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => openDetails(deposit)}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors group-hover:scale-105 transform duration-200"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                  View Details
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </motion.div>
      </div>

      {/* Deposit Details Modal */}
      <AnimatePresence>
        {modalOpen && selectedDeposit && (
          <Transition appear show={modalOpen} as={Fragment}>
            <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={closeDetails}>
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
                  <Dialog.Panel
                    as={motion.div}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
                  >
                    {/* Modal Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <Dialog.Title className="text-2xl font-bold">
                            USDT Deposit Details
                          </Dialog.Title>
                          <p className="text-blue-100 mt-1">
                            Transaction: {selectedDeposit.tx_id}
                          </p>
                        </div>
                        <button 
                          onClick={closeDetails}
                          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>
                    </div>

                    {/* Modal Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {/* Transaction Overview */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            <CurrencyDollarIcon className="h-5 w-5" />
                            Amount
                          </h3>
                          <p className="text-2xl font-bold text-blue-600">
                            ${selectedDeposit.amount.toLocaleString()} USDT
                          </p>
                        </div>
                        
                        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                          <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                            <CheckCircleIcon className="h-5 w-5" />
                            Status
                          </h3>
                          <span className="inline-flex items-center gap-1 px-3 py-2 rounded-lg font-medium bg-green-100 text-green-800 border border-green-200">
                            <CheckCircleIcon className="h-4 w-4" />
                            Confirmed
                          </span>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            Received At
                          </h3>
                          <p className="text-gray-700">
                            {new Date(selectedDeposit.received_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Transaction Details */}
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <LinkIcon className="h-5 w-5" />
                          Transaction Information
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Transaction ID</label>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="font-mono text-sm bg-white p-3 rounded-lg border flex-1 break-all">
                                {selectedDeposit.tx_id}
                              </p>
                              <button
                                onClick={() => window.open(`https://tronscan.org/#/transaction/${selectedDeposit.tx_id}`, '_blank')}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs flex items-center gap-1"
                              >
                                <GlobeAltIcon className="h-4 w-4" />
                                View on TronScan
                              </button>
                            </div>
                          </div>
                          
                          {selectedDeposit.created_at && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Created At</label>
                              <p className="text-gray-900 mt-1">
                                {new Date(selectedDeposit.created_at).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* User Information */}
                      <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                        <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                          <UserIcon className="h-5 w-5" />
                          User Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-purple-700">Full Name</label>
                            <p className="text-purple-900 font-medium">
                              {selectedDeposit.user_profile?.full_name || 'Not provided'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-purple-700">Phone Number</label>
                            <p className="text-purple-900">
                              {selectedDeposit.user_profile?.phone_number || 'Not provided'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-purple-700">User ID</label>
                            <p className="text-purple-900 font-mono text-xs">
                              {selectedDeposit.user_id}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-purple-700">KYC Status</label>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                              selectedDeposit.user_profile?.kyc_status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {selectedDeposit.user_profile?.kyc_status || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Additional Information */}
                      <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                        <h3 className="font-semibold text-yellow-900 mb-4 flex items-center gap-2">
                          <DocumentTextIcon className="h-5 w-5" />
                          Additional Information
                        </h3>
                        <div className="text-sm text-yellow-800">
                          <p className="mb-2">
                            <strong>Network:</strong> TRON (TRC-20)
                          </p>
                          <p className="mb-2">
                            <strong>Confirmation Status:</strong> Confirmed and processed
                          </p>
                          <p>
                            <strong>Processing:</strong> This deposit has been automatically confirmed and added to the user's wallet balance.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                      <div className="flex justify-end">
                        <button
                          onClick={closeDetails}
                          className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-white transition-colors"
                        >
                          Close
                        </button>
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