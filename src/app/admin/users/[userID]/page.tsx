'use client'

import React, { useState, useEffect, Fragment } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import { Dialog, Transition } from '@headlessui/react'
import {
  ArrowLeftIcon,
  UserIcon,
  IdentificationIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  WalletIcon,
  LockClosedIcon,
  LockOpenIcon,
  NoSymbolIcon,
  DocumentTextIcon,
  MapPinIcon,
  CameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentMagnifyingGlassIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'

type UserDetails = {
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
    created_at: string
  }[]
  user_wallets: {
    balance: number
    locked_balance: number
    total_balance: number
    trx_balance: number
    address: string
    private_key?: string
    created_at: string
  }[]
}

type KYCSubmission = {
  id: string
  doc_type: string
  front_url: string | null
  back_url: string | null
  address_url: string | null
  face_image_url: string | null
  kyc_status: 'not_submitted' | 'pending' | 'approved' | 'rejected'
  created_at: string
  admin_notes: string | null
}

type Transaction = {
  id: string
  type: string
  amount: number
  status: string
  created_at: string
  description: string
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

export default function UserDetailPage() {
  const params = useParams()
  const userId = (params?.userID as string) || ''
  const supabase = createClientComponentClient<Database>()

  const [user, setUser] = useState<UserDetails | null>(null)
  const [kycSubmission, setKycSubmission] = useState<KYCSubmission | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [actionType, setActionType] = useState<'suspend' | 'lock_withdrawal' | 'unlock_withdrawal' | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionNotes, setActionNotes] = useState('')

  // Load user details
  async function loadUserDetails() {
    setLoading(true)
    setError(null)
    try {
      console.log('🔍 Loading user details for ID:', userId)
      
      // First, let's check if user exists at all (without .single())
      const { data: userCheck, error: userCheckError } = await supabase
        .from('user_profile')
        .select('uid, full_name')
        .eq('uid', userId)
      
      console.log('🔍 User existence check:', { userCheck, userCheckError, userId })
      
      if (userCheckError) {
        console.error('❌ User check error:', JSON.stringify(userCheckError, null, 2))
        throw new Error(`Database error: ${userCheckError.message || 'Unknown error'}`)
      }
      
      if (!userCheck || userCheck.length === 0) {
        console.error('❌ No user found with ID:', userId)
        throw new Error(`User with ID ${userId} not found in database`)
      }
      
      // Load user profile (this is the main table)
      const { data: profileData, error: profileError } = await supabase
        .from('user_profile')
        .select('uid, full_name, phone_number, cnic_number, kyc_status, is_locked, created_at')
        .eq('uid', userId)
        .single()

      console.log('👤 Profile query result:', { profileData, profileError: JSON.stringify(profileError, null, 2) })

      if (profileError) {
        console.error('❌ Profile error details:', JSON.stringify(profileError, null, 2))
        throw new Error(`Profile query failed: ${profileError.message || 'Unknown error'}`)
      }

      if (!profileData) {
        console.error('❌ No profile data found for user:', userId)
        throw new Error('User profile not found')
      }

      // Fetch email from auth system via API route
      let userEmail = userId // fallback to uid
      try {
        const emailResponse = await fetch(`/api/admin/get-user-email?userId=${userId}`)
        if (emailResponse.ok) {
          const emailData = await emailResponse.json()
          if (emailData.email) {
            userEmail = emailData.email
            console.log('📧 Email found from auth:', userEmail)
          }
        } else {
          console.log('📧 Could not fetch email from API, using fallback')
        }
      } catch (emailErr) {
        console.log('📧 Error fetching email, using fallback:', emailErr)
      }

      // Get PKR wallet
      const { data: pkrWallet, error: pkrError } = await supabase
        .from('user_pkr_wallets')
        .select('total_balance, locked_balance, created_at')
        .eq('user_id', userId)
        .maybeSingle() // Use maybeSingle to allow no results

      console.log('💰 PKR wallet query result:', { pkrWallet, pkrError: JSON.stringify(pkrError, null, 2) })

      // Get USDT wallet
      console.log('🔍 Querying USDT wallet for user_id:', userId)
      
      // First check if ANY record exists for this user
      const { data: usdtCheck, error: usdtCheckError } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId)
      
      console.log('🔍 USDT wallet existence check:', { 
        usdtCheck, 
        usdtCheckError: JSON.stringify(usdtCheckError, null, 2),
        userIdUsed: userId,
        recordCount: usdtCheck?.length || 0
      })

      const { data: usdtWallet, error: usdtError } = await supabase
        .from('user_wallets')
        .select('balance, locked_balance, total_balance, trx_balance, address, created_at')
        .eq('user_id', userId)
        .maybeSingle() // Use maybeSingle to allow no results

      console.log('🪙 USDT wallet query result:', { 
        usdtWallet, 
        usdtError: JSON.stringify(usdtError, null, 2),
        hasWallet: !!usdtWallet
      })

      // Combine the data
      const combinedUserData = {
        id: profileData.uid,
        email: userEmail,
        created_at: profileData.created_at,
        user_profile: [profileData],
        user_pkr_wallets: pkrWallet ? [pkrWallet] : [],
        user_wallets: usdtWallet ? [usdtWallet] : []
      }

      console.log('✅ Combined user data:', combinedUserData)
      setUser(combinedUserData as UserDetails)

      // Load KYC submission
      const { data: kycData, error: kycError } = await supabase
        .from('user_kyc_submissions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (!kycError && kycData) {
        console.log('📋 KYC data found:', kycData)
        setKycSubmission(kycData as KYCSubmission)
      } else {
        console.log('📋 No KYC data found:', kycError ? JSON.stringify(kycError, null, 2) : 'No data')
      }

      // Load transactions (simplified for now)
      const { data: txData, error: txError } = await supabase
        .from('user_pkr_deposits')
        .select('id, amount, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!txError && txData) {
        const formattedTx = txData.map(tx => ({
          id: tx.id,
          type: 'PKR Deposit',
          amount: tx.amount,
          status: tx.status,
          created_at: tx.created_at,
          description: `PKR Deposit - ₨${tx.amount.toLocaleString()}`
        }))
        setTransactions(formattedTx)
        console.log('💳 Transactions loaded:', formattedTx.length)
      } else {
        console.log('💳 No transactions found:', txError ? JSON.stringify(txError, null, 2) : 'No data')
      }

    } catch (err: any) {
      console.error('❌ Error in loadUserDetails:', {
        message: err.message,
        error: err,
        userId: userId
      })
      setError(err.message || 'Unknown error occurred')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      loadUserDetails()
    }
  }, [userId])

  // Handle admin actions
  async function handleAdminAction() {
    if (!actionType || !user) return
    
    setActionLoading(true)
    try {
      if (actionType === 'lock_withdrawal') {
        const { error } = await supabase
          .from('user_profile')
          .update({ is_locked: true })
          .eq('uid', userId)
        
        if (error) throw error
      } else if (actionType === 'unlock_withdrawal') {
        const { error } = await supabase
          .from('user_profile')
          .update({ is_locked: false })
          .eq('uid', userId)
        
        if (error) throw error
      }
      
      // You can add more admin actions here
      // For suspend user, you'd need to add a field to track suspension status
      
      await loadUserDetails()
      setActionModalOpen(false)
      setActionNotes('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user details...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl font-medium text-gray-600 mb-2">User not found</p>
          <Link 
            href="/admin/users" 
            className="text-blue-600 hover:text-blue-700 transition-colors"
          >
            Return to user list
          </Link>
        </div>
      </div>
    )
  }

  const profile = user.user_profile?.[0]
  const pkrWallet = user.user_pkr_wallets?.[0]
  const usdtWallet = user.user_wallets?.[0]
  const kycStatus = profile?.kyc_status || 'not_submitted'
  const StatusIcon = kycStatusConfig[kycStatus].icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/admin/users"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile?.full_name || 'User Details'}
                </h1>
                <p className="text-gray-600 mt-1">
                  User ID: {userId} • Joined {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${kycStatusConfig[kycStatus].classes}`}>
                <StatusIcon className="h-4 w-4" />
                KYC {kycStatusConfig[kycStatus].label}
              </span>
              
              {profile?.is_locked ? (
                <button
                  onClick={() => {setActionType('unlock_withdrawal'); setActionModalOpen(true)}}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <LockOpenIcon className="h-4 w-4" />
                  Unlock Withdrawals
                </button>
              ) : (
                <button
                  onClick={() => {setActionType('lock_withdrawal'); setActionModalOpen(true)}}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
                >
                  <LockClosedIcon className="h-4 w-4" />
                  Lock Withdrawals
                </button>
              )}
              
              <button
                onClick={() => {setActionType('suspend'); setActionModalOpen(true)}}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <NoSymbolIcon className="h-4 w-4" />
                Suspend User
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
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

        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-600">Full Name</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {profile?.full_name || 'Not provided'}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {user?.email || 'Not provided'}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">User ID</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">{userId}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Phone Number</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {profile?.phone_number || 'Not provided'}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">CNIC Number</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {profile?.cnic_number || 'Not provided'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Wallet Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* PKR Wallet */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <BanknotesIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">PKR Wallet</h3>
                <p className="text-sm text-gray-600">Pakistani Rupee Balance</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Balance</span>
                <span className="text-2xl font-bold text-green-600">
                  ₨{(pkrWallet?.total_balance || 0).toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Locked Balance</span>
                <span className="text-lg font-semibold text-yellow-600">
                  ₨{(pkrWallet?.locked_balance || 0).toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Withdrawal Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  profile?.is_locked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {profile?.is_locked ? 'Locked' : 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* USDT Wallet */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <WalletIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">USDT Wallet</h3>
                <p className="text-sm text-gray-600">Tether USD Balance</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Available Balance</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${(usdtWallet?.balance || 0).toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Locked Balance</span>
                <span className="text-lg font-semibold text-yellow-600">
                  ${(usdtWallet?.locked_balance || 0).toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Balance</span>
                <span className="text-lg font-semibold text-green-600">
                  ${(usdtWallet?.total_balance || 0).toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">TRX Balance</span>
                <span className="text-lg font-semibold text-purple-600">
                  {(usdtWallet?.trx_balance || 0).toLocaleString()} TRX
                </span>
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <label className="text-sm font-medium text-gray-600">Wallet Address</label>
                <p className="text-xs font-mono text-gray-800 mt-1 break-all bg-gray-50 p-2 rounded">
                  {usdtWallet?.address || 'Not generated'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* KYC Details */}
        {kycSubmission && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">KYC Documents</h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { url: kycSubmission.front_url, label: 'Front ID', icon: IdentificationIcon },
                { url: kycSubmission.back_url, label: 'Back ID', icon: DocumentTextIcon },
                { url: kycSubmission.address_url, label: 'Address Proof', icon: MapPinIcon },
                { url: kycSubmission.face_image_url, label: 'Face Photo', icon: CameraIcon }
              ].map((doc, index) => (
                doc.url ? (
                  <div key={index} className="group relative">
                    <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors">
                      <img 
                        src={doc.url} 
                        alt={doc.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 cursor-pointer"
                        onClick={() => window.open(doc.url!, '_blank')}
                      />
                    </div>
                    <p className="text-center text-sm font-medium text-gray-700 mt-2 flex items-center justify-center gap-1">
                      <doc.icon className="h-4 w-4" />
                      {doc.label}
                    </p>
                  </div>
                ) : (
                  <div key={index} className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                    <doc.icon className="h-8 w-8 mb-2" />
                    <p className="text-sm">{doc.label}</p>
                    <p className="text-xs">Not provided</p>
                  </div>
                )
              ))}
            </div>
            
            {kycSubmission.admin_notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Admin Notes</h4>
                <p className="text-yellow-800">{kycSubmission.admin_notes}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
            <Link 
              href={`/admin/users/${userId}/transactions`}
              className="text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx, index) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <ArrowDownIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{tx.description}</p>
                      <p className="text-sm text-gray-600">{new Date(tx.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-green-600">₨{tx.amount.toLocaleString()}</p>
                    <p className={`text-xs px-2 py-1 rounded-full ${
                      tx.status === 'approved' ? 'bg-green-100 text-green-800' :
                      tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {tx.status.toUpperCase()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Admin Action Modal */}
      <AnimatePresence>
        {actionModalOpen && (
          <Transition appear show={actionModalOpen} as={Fragment}>
            <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={() => setActionModalOpen(false)}>
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
                  <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        {actionType === 'suspend' ? 'Suspend User' : actionType === 'lock_withdrawal' ? 'Lock Withdrawals' : 'Unlock Withdrawals'}
                      </Dialog.Title>
                      <button 
                        onClick={() => setActionModalOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <p className="text-gray-600">
                        {actionType === 'suspend' 
                          ? 'This will suspend the user account and prevent access to the platform.'
                          : actionType === 'lock_withdrawal' ? 'This will lock all withdrawal capabilities for this user.' : 'This will unlock withdrawal capabilities for this user.'
                        }
                      </p>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reason (Optional)
                        </label>
                        <textarea
                          rows={3}
                          value={actionNotes}
                          onChange={(e) => setActionNotes(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter reason for this action..."
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={() => setActionModalOpen(false)}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAdminAction}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                      >
                        {actionLoading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          actionType === 'suspend' ? <NoSymbolIcon className="h-4 w-4" /> :
                          actionType === 'lock_withdrawal' ? <LockClosedIcon className="h-4 w-4" /> : <LockOpenIcon className="h-4 w-4" />
                        )}
                        Confirm
                      </button>
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