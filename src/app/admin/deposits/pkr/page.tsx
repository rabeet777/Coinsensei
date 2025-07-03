// src/app/admin/deposits/pkr/page.tsx
'use client'

import React, { useState, useEffect, Fragment } from 'react'
import { Tab, Dialog, Transition } from '@headlessui/react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import type { Database } from '@/lib/database.types'
import {
  BanknotesIcon,
  PhotoIcon,
  XMarkIcon,
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  DocumentMagnifyingGlassIcon,
  ChartBarIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  HashtagIcon,
  IdentificationIcon,
  EyeIcon,
  DocumentTextIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

type Deposit = {
  id: string
  user_id: string
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  screenshot_url: string | null
  created_at: string
  admin_notes: string | null
  admin_id: string | null

  // payment‐method columns
  method_type: string | null
  method_bank_name: string | null
  method_account_number: string | null
  method_iban: string | null
  method_account_title: string | null

  // joined profile
  user_profile: { full_name: string }
}

const tabs = ['pending','approved','rejected'] as const
type TabStatus = typeof tabs[number]

export default function AdminDepositsPKRPage() {
  const supabase = createClientComponentClient<Database>()

  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit|null>(null)
  const [adminNoteDraft, setAdminNoteDraft] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [currentTab, setCurrentTab] = useState<TabStatus>('pending')

  // load deposits with user_profile join
  async function loadDeposits() {
    setLoading(true)
    setError(null)
    try {
    const { data, error } = await supabase
      .from('user_pkr_deposits')
      .select(`
        *,
        user_profile!inner(full_name)
      `)
      .order('created_at', { ascending: false })
      
      if (error) throw error
      setDeposits(data as Deposit[])
    } catch (err: any) {
      setError(err.message)
    } finally {
    setLoading(false)
    }
  }

  useEffect(() => { loadDeposits() }, [])

  // open the details dialog
  function openDetails(d: Deposit) {
    setSelectedDeposit(d)
    setAdminNoteDraft(d.admin_notes || '')
    setDetailsOpen(true)
  }

  function closeDetails() {
    setDetailsOpen(false)
    setSelectedDeposit(null)
  }

  // approve or reject
  async function handleAction(action: 'approved'|'rejected') {
    if (!selectedDeposit) return
    setActionLoading(true)
    setError(null)
    try {
      // if approving, bump wallet
      if (action === 'approved') {
        const { data: dep } = await supabase
          .from('user_pkr_deposits')
          .select('user_id,amount')
          .eq('id', selectedDeposit.id)
          .single()
        const { data: w } = await supabase
          .from('user_pkr_wallets')
          .select('balance')
          .eq('user_id', dep!.user_id)
          .single()
        await supabase
          .from('user_pkr_wallets')
          .update({ balance: (w?.balance||0) + (dep?.amount||0) })
          .eq('user_id', dep!.user_id)
      }

      // update the deposit row
      const {
        data: { session }
      } = await supabase.auth.getSession()

      await supabase
        .from('user_pkr_deposits')
        .update({
          status: action,
          admin_notes: adminNoteDraft,
          admin_id: session!.user!.id
        })
        .eq('id', selectedDeposit.id)

      // refresh and close
      await loadDeposits()
      setCurrentTab(action)
      closeDetails()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const statusConfig = {
    pending: { 
      classes: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      icon: ClockIcon, 
      color: 'yellow' 
    },
    approved: { 
      classes: 'bg-green-100 text-green-800 border-green-200', 
      icon: CheckCircleIcon, 
      color: 'green' 
    },
    rejected: { 
      classes: 'bg-red-100 text-red-800 border-red-200', 
      icon: XCircleIcon, 
      color: 'red' 
    },
  }

  const labels: Record<TabStatus, string> = {
    pending: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
  }

  // Filter deposits based on search query
  const filteredDeposits = deposits.filter(deposit => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      deposit.id.toLowerCase().includes(query) ||
      deposit.user_profile.full_name?.toLowerCase().includes(query) ||
      deposit.amount.toString().includes(query) ||
      deposit.method_type?.toLowerCase().includes(query)
    )
  })

  // Calculate statistics
  const stats = {
    total: deposits.length,
    pending: deposits.filter(d => d.status === 'pending').length,
    approved: deposits.filter(d => d.status === 'approved').length,
    rejected: deposits.filter(d => d.status === 'rejected').length,
    totalAmount: deposits.filter(d => d.status === 'approved').reduce((sum, d) => sum + d.amount, 0),
    pendingAmount: deposits.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.amount, 0),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white border-b border-green-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-green-500 to-green-700 bg-clip-text text-transparent">
                PKR Deposits
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Review and manage Pakistani Rupee deposit requests
              </p>
            </div>
            <div className="flex items-center gap-3">
              <BanknotesIcon className="h-12 w-12 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-xl">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
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
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
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
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-xl">
                <XCircleIcon className="h-6 w-6 text-red-600" />
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
                <p className="text-sm font-medium text-gray-600">Approved Volume</p>
                <p className="text-2xl font-bold text-green-600">₨{stats.totalAmount.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <BanknotesIcon className="h-6 w-6 text-green-600" />
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
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user name, deposit ID, or amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>
            <button
              onClick={loadDeposits}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <Tab.Group 
            selectedIndex={tabs.indexOf(currentTab)} 
            onChange={i=>setCurrentTab(tabs[i])}
          >
            <div className="border-b border-gray-200">
              <Tab.List className="flex">
                {tabs.map((status, index) => {
                  const StatusIcon = statusConfig[status].icon
                  const count = filteredDeposits.filter(d => d.status === status).length
                  
                  return (
                    <Tab key={status}
              className={({ selected }) =>
                        `flex-1 flex items-center justify-center gap-3 px-6 py-4 text-sm font-medium transition-all ${
                  selected
                            ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`
                      }>
                      <StatusIcon className="h-5 w-5" />
                      {labels[status]}
                      {count > 0 && (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          currentTab === status 
                            ? 'bg-green-100 text-green-700' 
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
          {tabs.map(status => (
                <Tab.Panel key={status} className="p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading deposits...</p>
                      </div>
                    </div>
                  ) : filteredDeposits.filter(d=>d.status===status).length === 0 ? (
                    <div className="text-center py-12">
                      <DocumentMagnifyingGlassIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-xl font-medium text-gray-600 mb-2">
                        No {labels[status].toLowerCase()} deposits
                      </p>
                      <p className="text-gray-500">
                        {searchQuery ? 'Try adjusting your search criteria' : 'All clear for now!'}
                              </p>
                            </div>
                  ) : (
                    <div className="grid gap-4">
                      <AnimatePresence>
                        {filteredDeposits.filter(d=>d.status===status).map((deposit, index) => {
                          const StatusIcon = statusConfig[deposit.status].icon
                          
                          return (
                            <motion.div
                              key={deposit.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ delay: index * 0.05 }}
                              className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-green-300 transition-all duration-200"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                                    <BanknotesIcon className="h-6 w-6 text-white" />
                                  </div>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h3 className="text-lg font-semibold text-gray-900">
                                        {deposit.user_profile.full_name}
                                      </h3>
                                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig[deposit.status].classes}`}>
                                        <StatusIcon className="h-3 w-3" />
                                        {deposit.status.toUpperCase()}
                                      </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                                      <div className="flex items-center gap-2">
                                        <IdentificationIcon className="h-4 w-4" />
                                        <span>ID: {deposit.id.toString().slice(0, 8)}...</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <CurrencyDollarIcon className="h-4 w-4" />
                                        <span className="font-semibold text-green-600">₨{deposit.amount.toLocaleString()}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4" />
                                        <span>{new Date(deposit.created_at).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                    
                                    {deposit.method_type && (
                                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                                        <CreditCardIcon className="h-4 w-4" />
                                        <span>via {deposit.method_type}</span>
                                        {deposit.method_bank_name && (
                                          <span>• {deposit.method_bank_name}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    {deposit.screenshot_url && (
                                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white">
                                        <PhotoIcon className="h-4 w-4 text-blue-600" />
                                      </div>
                                    )}
                          </div>
                                  
                          <button
                                    onClick={() => openDetails(deposit)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors group-hover:scale-105 transform duration-200"
                          >
                                    <EyeIcon className="h-4 w-4" />
                                    Review
                          </button>
                        </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </div>
                  )}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
        </motion.div>
      </div>

      {/* ENHANCED DETAILS MODAL */}
      <AnimatePresence>
        {detailsOpen && selectedDeposit && (
<Transition appear show={detailsOpen} as={Fragment}>
  <Dialog
    as="div"
    className="fixed inset-0 z-50 overflow-y-auto"
    onClose={closeDetails}
  >
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
                    className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
                  >
                    {/* Modal Header */}
                    <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <Dialog.Title className="text-2xl font-bold">
                            PKR Deposit Review - {selectedDeposit.user_profile.full_name}
            </Dialog.Title>
                          <p className="text-green-100 mt-1">
                            Deposit ID: {selectedDeposit.id} • ₨{selectedDeposit.amount.toLocaleString()}
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
                      {/* Status and Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <UserIcon className="h-5 w-5" />
                            Current Status
                          </h3>
                          <div className="flex items-center gap-3">
                            {React.createElement(statusConfig[selectedDeposit.status].icon, {
                              className: "h-8 w-8 text-gray-600"
                            })}
                            <span className={`px-3 py-2 rounded-lg font-medium border ${statusConfig[selectedDeposit.status].classes}`}>
                              {selectedDeposit.status.toUpperCase()}
              </span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <CurrencyDollarIcon className="h-5 w-5" />
                            Amount
                          </h3>
                          <p className="text-2xl font-bold text-green-600">
                            ₨{selectedDeposit.amount.toLocaleString()}
                          </p>
              </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            Submission Date
                          </h3>
                          <p className="text-gray-700">
                            {new Date(selectedDeposit.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Payment Method Details */}
                      {selectedDeposit.method_type && (
                        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                          <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                            <CreditCardIcon className="h-5 w-5" />
                            Payment Method Details
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-blue-700">Method Type</label>
                              <p className="text-blue-900 font-medium">{selectedDeposit.method_type}</p>
                            </div>
                {selectedDeposit.method_bank_name && (
                              <div>
                                <label className="text-sm font-medium text-blue-700">Bank Name</label>
                                <p className="text-blue-900">{selectedDeposit.method_bank_name}</p>
                              </div>
                )}
                {selectedDeposit.method_account_number && (
                              <div>
                                <label className="text-sm font-medium text-blue-700">Account Number</label>
                                <p className="text-blue-900 font-mono">{selectedDeposit.method_account_number}</p>
                              </div>
                )}
                {selectedDeposit.method_account_title && (
                              <div>
                                <label className="text-sm font-medium text-blue-700">Account Title</label>
                                <p className="text-blue-900">{selectedDeposit.method_account_title}</p>
                              </div>
                            )}
                          </div>
                          {selectedDeposit.method_iban && (
                            <div className="mt-4 pt-4 border-t border-blue-200">
                              <label className="text-sm font-medium text-blue-700">IBAN</label>
                              <p className="text-blue-900 font-mono bg-white p-2 rounded mt-1">{selectedDeposit.method_iban}</p>
                            </div>
                )}
              </div>
            )}

                      {/* Payment Proof */}
                      {selectedDeposit.screenshot_url && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <PhotoIcon className="h-5 w-5" />
                            Payment Proof
                          </h3>
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <div className="flex items-center justify-center">
                              <img
                                src={selectedDeposit.screenshot_url}
                                alt="Payment proof"
                                className="max-h-64 rounded-lg border border-gray-300 object-contain cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => window.open(selectedDeposit.screenshot_url!, '_blank')}
                              />
                            </div>
                            <p className="text-center text-sm text-gray-600 mt-2">
                              Click to view full size
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Admin Notes */}
                      <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                        <h3 className="font-semibold text-yellow-900 mb-4 flex items-center gap-2">
                          <DocumentTextIcon className="h-5 w-5" />
                          Admin Notes
                        </h3>
              <textarea
                          rows={4}
                value={adminNoteDraft}
                onChange={e => setAdminNoteDraft(e.target.value)}
                          className="w-full px-4 py-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                          placeholder="Add notes about this deposit review..."
              />
          </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={closeDetails}
                          className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        
                        {selectedDeposit.status === 'pending' && (
                          <>
            <button
              onClick={() => handleAction('rejected')}
                              disabled={actionLoading}
                              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                              {actionLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <XCircleIcon className="h-5 w-5" />
                              )}
                              Reject Deposit
            </button>
                            
            <button
              onClick={() => handleAction('approved')}
                              disabled={actionLoading}
                              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                              {actionLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <CheckCircleIcon className="h-5 w-5" />
                              )}
                              Approve & Add to Wallet
            </button>
                          </>
                        )}
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
