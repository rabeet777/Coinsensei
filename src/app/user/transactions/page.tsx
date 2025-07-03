'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowsRightLeftIcon,
  GlobeAltIcon,
  XMarkIcon,
  DocumentTextIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  LinkIcon,
  HashtagIcon,
  UserIcon,
  CameraIcon
} from '@heroicons/react/24/outline'
import type { Database } from '@/lib/database.types'

// Unified transaction type
type Transaction = {
  id: string
  type: 'usdt_deposit' | 'usdt_withdrawal' | 'pkr_deposit' | 'pkr_withdrawal'
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'processing'
  created_at: string
  tx_id?: string | null
  to_address?: string
  from_address?: string
  method_type?: string
  fee?: number
  description?: string
  // Additional details for modal
  raw_data?: any // Store the original transaction data
}

type CurrencyFilter = 'usdt' | 'pkr'
type FilterType = 'all' | 'deposits' | 'withdrawals'
type StatusFilter = 'all' | 'completed' | 'pending' | 'failed' | 'cancelled'

export default function TransactionsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showModal, setShowModal] = useState(false)
  
  // Filters
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>('usdt')
  const [typeFilter, setTypeFilter] = useState<FilterType>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('all')

  // Fetch all transaction data
  useEffect(() => {
    fetchTransactions()
  }, [])

  // Apply filters
  useEffect(() => {
    applyFilters()
  }, [transactions, currencyFilter, typeFilter, statusFilter, searchQuery, dateRange])

  const fetchTransactions = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session?.user) {
        router.replace('/auth/login')
        return
      }

      const userId = session.user.id
      const allTransactions: Transaction[] = []

      // Fetch USDT deposits (processed_txs)
      const { data: usdtDeposits, error: depositError } = await supabase
        .from('processed_txs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (depositError) throw depositError

      usdtDeposits?.forEach((tx, index) => {
        const validId = tx.id && 
                        tx.id !== 'undefined' && 
                        tx.id !== 'null' && 
                        String(tx.id).trim() !== ''
        allTransactions.push({
          id: validId ? `usdt_deposit_${tx.id}` : `usdt_deposit_${Date.parse(tx.created_at)}_${index}`,
          type: 'usdt_deposit',
          amount: tx.amount,
          status: tx.status === 'confirmed' ? 'completed' : 'pending',
          created_at: tx.created_at,
          tx_id: tx.tx_id,
          from_address: tx.from_address,
          description: `USDT Deposit - ${tx.tx_id?.slice(0, 8)}...`,
          raw_data: tx
        })
      })

      // Fetch USDT withdrawals
      const { data: usdtWithdrawals, error: withdrawalError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (withdrawalError) throw withdrawalError

      usdtWithdrawals?.forEach((tx, index) => {
        const validId = tx.id && 
                        tx.id !== 'undefined' && 
                        tx.id !== 'null' && 
                        String(tx.id).trim() !== ''
        allTransactions.push({
          id: validId ? `usdt_withdrawal_${tx.id}` : `usdt_withdrawal_${Date.parse(tx.created_at)}_${index}`,
          type: 'usdt_withdrawal',
          amount: tx.amount,
          status: tx.status,
          created_at: tx.created_at,
          tx_id: tx.tx_id,
          to_address: tx.to_address,
          fee: tx.fee,
          description: `USDT Withdrawal - ${tx.to_address?.slice(0, 8)}...`,
          raw_data: tx
        })
      })

      // Fetch PKR deposits
      const { data: pkrDeposits, error: pkrDepositError } = await supabase
        .from('user_pkr_deposits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (pkrDepositError) throw pkrDepositError

      pkrDeposits?.forEach((tx, index) => {
        const validId = tx.id && 
                        tx.id !== 'undefined' && 
                        tx.id !== 'null' && 
                        String(tx.id).trim() !== ''
        allTransactions.push({
          id: validId ? `pkr_deposit_${tx.id}` : `pkr_deposit_${Date.parse(tx.created_at)}_${index}`,
          type: 'pkr_deposit',
          amount: tx.amount,
          status: tx.status,
          created_at: tx.created_at,
          method_type: tx.method_type,
          description: `PKR Deposit via ${tx.method_type}`,
          raw_data: tx
        })
      })

      // Fetch PKR withdrawals
      const { data: pkrWithdrawals, error: pkrWithdrawalError } = await supabase
        .from('user_pkr_withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (pkrWithdrawalError) throw pkrWithdrawalError

      pkrWithdrawals?.forEach((tx, index) => {
        const validId = tx.id && 
                        tx.id !== 'undefined' && 
                        tx.id !== 'null' && 
                        String(tx.id).trim() !== ''
        allTransactions.push({
          id: validId ? `pkr_withdrawal_${tx.id}` : `pkr_withdrawal_${Date.parse(tx.created_at)}_${index}`,
          type: 'pkr_withdrawal',
          amount: tx.amount,
          status: tx.status,
          created_at: tx.created_at,
          method_type: tx.method_type,
          description: `PKR Withdrawal to ${tx.method_account_number}`,
          raw_data: tx
        })
      })

      // Sort all transactions by date (newest first)
      allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      setTransactions(allTransactions)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...transactions]

    // Currency filter (PKR or USDT)
    filtered = filtered.filter(tx => tx.type.includes(currencyFilter))

    // Type filter
    if (typeFilter !== 'all') {
      switch (typeFilter) {
        case 'deposits':
          filtered = filtered.filter(tx => tx.type.includes('deposit'))
          break
        case 'withdrawals':
          filtered = filtered.filter(tx => tx.type.includes('withdrawal'))
          break
      }
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(tx => 
        tx.description?.toLowerCase().includes(query) ||
        tx.tx_id?.toLowerCase().includes(query) ||
        tx.to_address?.toLowerCase().includes(query) ||
        tx.from_address?.toLowerCase().includes(query)
      )
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date()
      const days = parseInt(dateRange.replace('d', ''))
      const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))
      filtered = filtered.filter(tx => new Date(tx.created_at) >= cutoff)
    }

    setFilteredTransactions(filtered)
  }

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedTransaction(null)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'usdt_deposit':
        return <ArrowDownIcon className="h-5 w-5 text-green-600" />
      case 'usdt_withdrawal':
        return <ArrowUpIcon className="h-5 w-5 text-red-600" />
      case 'pkr_deposit':
        return <ArrowDownIcon className="h-5 w-5 text-green-600" />
      case 'pkr_withdrawal':
        return <ArrowUpIcon className="h-5 w-5 text-red-600" />
    }
  }

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />
      case 'pending':
      case 'processing':
        return <ClockIcon className="h-4 w-4 text-yellow-600" />
      case 'failed':
        return <XCircleIcon className="h-4 w-4 text-red-600" />
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: Transaction['status']) => {
    const baseClasses = "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
    
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'pending':
      case 'processing':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'cancelled':
        return `${baseClasses} bg-gray-100 text-gray-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const getCurrencyIcon = (type: Transaction['type']) => {
    if (type.includes('usdt')) {
      return <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
    } else {
      return <BanknotesIcon className="h-6 w-6 text-green-600" />
    }
  }

  const formatAmount = (amount: number, type: Transaction['type']) => {
    if (type.includes('usdt')) {
      return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USDT`
    } else {
      return `₨ ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    }
  }

  const renderTransactionDetails = (transaction: Transaction) => {
    const rawData = transaction.raw_data

    if (transaction.type === 'usdt_deposit') {
      return (
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <ArrowDownIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">USDT Deposit Received</h3>
                <p className="text-green-600 text-sm">Processed by CoinSensei</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-700">
              +{formatAmount(transaction.amount, transaction.type)}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-sm font-medium text-gray-500 mb-2 block">Transaction Hash</label>
                <div className="space-y-2">
                  <div className="font-mono text-sm bg-white border rounded-lg p-3 break-all">
                    {transaction.tx_id}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => copyToClipboard(transaction.tx_id || '')}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm transition-colors"
                    >
                      <DocumentTextIcon className="h-4 w-4" />
                      Copy Hash
                    </button>
                    {transaction.tx_id && (
                      <button
                        onClick={() => window.open(`https://tronscan.org/#/transaction/${transaction.tx_id}`, '_blank')}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm transition-colors"
                      >
                        <LinkIcon className="h-4 w-4" />
                        View on Explorer
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-sm font-medium text-gray-500 mb-2 block">From Address</label>
                <div className="space-y-2">
                  <div className="font-mono text-sm bg-white border rounded-lg p-3 break-all">
                    {transaction.from_address}
                  </div>
                  <button 
                    onClick={() => copyToClipboard(transaction.from_address || '')}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm transition-colors"
                  >
                    <DocumentTextIcon className="h-4 w-4" />
                    Copy Address
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-sm font-medium text-gray-500 mb-2 block">Network</label>
                <div className="flex items-center gap-2">
                  <GlobeAltIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">TRON (TRC-20)</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-sm font-medium text-gray-500 mb-2 block">Status</label>
                <div className="flex items-center gap-2">
                  <span className={getStatusBadge(transaction.status)}>
                    {getStatusIcon(transaction.status)}
                    {transaction.status}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-sm font-medium text-gray-500 mb-2 block">Date & Time</label>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{new Date(transaction.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-2">About This Transaction</h4>
                <p className="text-xs text-blue-600">
                  This USDT deposit was automatically detected and processed by CoinSensei's system. 
                  Your balance has been updated accordingly.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (transaction.type === 'usdt_withdrawal') {
      return (
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <ArrowUpIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-800">USDT Withdrawal</h3>
                <p className="text-red-600 text-sm">Processed by CoinSensei</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-red-700">
              -{formatAmount(transaction.amount, transaction.type)}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-sm font-medium text-gray-500 mb-2 block">Destination Address</label>
                <div className="space-y-2">
                  <div className="font-mono text-sm bg-white border rounded-lg p-3 break-all">
                    {transaction.to_address}
                  </div>
                  <button 
                    onClick={() => copyToClipboard(transaction.to_address || '')}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm transition-colors"
                  >
                    <DocumentTextIcon className="h-4 w-4" />
                    Copy Address
                  </button>
                </div>
              </div>

              {transaction.tx_id && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Transaction Hash</label>
                  <div className="space-y-2">
                    <div className="font-mono text-sm bg-white border rounded-lg p-3 break-all">
                      {transaction.tx_id}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => copyToClipboard(transaction.tx_id || '')}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm transition-colors"
                      >
                        <DocumentTextIcon className="h-4 w-4" />
                        Copy Hash
                      </button>
                      <button
                        onClick={() => window.open(`https://tronscan.org/#/transaction/${transaction.tx_id}`, '_blank')}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm transition-colors"
                      >
                        <LinkIcon className="h-4 w-4" />
                        View on Explorer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-sm font-medium text-gray-500 mb-2 block">Network</label>
                <div className="flex items-center gap-2">
                  <GlobeAltIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">TRON (TRC-20)</span>
                </div>
              </div>

              {rawData?.type && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Transaction Type</label>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      rawData.type === 'internal' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {rawData.type === 'internal' ? '🏢 Internal Transfer' : '🌐 External Transfer'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {transaction.fee && transaction.fee > 0 && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <label className="text-sm font-medium text-yellow-700 mb-2 block">Network Fee</label>
                  <div className="text-lg font-semibold text-yellow-800">
                    {formatAmount(transaction.fee, transaction.type)}
                  </div>
                  <p className="text-xs text-yellow-600 mt-1">
                    Fee charged by TRON network
                  </p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-sm font-medium text-gray-500 mb-2 block">Status</label>
                <div className="flex items-center gap-2">
                  <span className={getStatusBadge(transaction.status)}>
                    {getStatusIcon(transaction.status)}
                    {transaction.status}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-sm font-medium text-gray-500 mb-2 block">Date & Time</label>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{new Date(transaction.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-2">About This Withdrawal</h4>
                <p className="text-xs text-blue-600">
                  {rawData?.type === 'internal' 
                    ? 'This was an internal transfer within CoinSensei platform. No blockchain fees were applied.'
                    : 'This withdrawal was sent to an external wallet address on the TRON blockchain.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (transaction.type === 'pkr_deposit') {
      return (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Payment Method</label>
                <div className="flex items-center gap-2 mt-1">
                  <CreditCardIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{rawData?.method_type}</span>
                </div>
              </div>

              {rawData?.method_bank_name && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Bank Name</label>
                  <div className="flex items-center gap-2 mt-1">
                    <BuildingLibraryIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{rawData.method_bank_name}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">Account Number</label>
                <div className="flex items-center gap-2 mt-1">
                  <HashtagIcon className="h-4 w-4 text-gray-400" />
                  <span className="font-mono text-sm">{rawData?.method_account_number}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Account Title</label>
                <div className="flex items-center gap-2 mt-1">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{rawData?.method_account_title}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Amount</label>
                <p className="text-lg font-semibold text-green-600">{formatAmount(transaction.amount, transaction.type)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <span className={getStatusBadge(transaction.status)}>
                    {getStatusIcon(transaction.status)}
                    {transaction.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Submitted Date</label>
                <p className="text-sm">{new Date(transaction.created_at).toLocaleString()}</p>
              </div>

              {rawData?.screenshot_url && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Proof</label>
                  <button
                    onClick={() => window.open(rawData.screenshot_url, '_blank')}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors mt-1"
                  >
                    <CameraIcon className="h-4 w-4" />
                    View Screenshot
                  </button>
                </div>
              )}
            </div>
          </div>

          {rawData?.method_iban && (
            <div className="border-t pt-4">
              <label className="text-sm font-medium text-gray-500">IBAN</label>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-sm bg-gray-100 p-2 rounded">{rawData.method_iban}</span>
                <button 
                  onClick={() => copyToClipboard(rawData.method_iban)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <DocumentTextIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )
    }

    if (transaction.type === 'pkr_withdrawal') {
      return (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Payment Method</label>
                <div className="flex items-center gap-2 mt-1">
                  <CreditCardIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{rawData?.method_type}</span>
                </div>
              </div>

              {rawData?.method_bank_name && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Bank Name</label>
                  <div className="flex items-center gap-2 mt-1">
                    <BuildingLibraryIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{rawData.method_bank_name}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">Account Number</label>
                <div className="flex items-center gap-2 mt-1">
                  <HashtagIcon className="h-4 w-4 text-gray-400" />
                  <span className="font-mono text-sm">{rawData?.method_account_number}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Account Title</label>
                <div className="flex items-center gap-2 mt-1">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{rawData?.method_account_title}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Amount</label>
                <p className="text-lg font-semibold text-red-600">-{formatAmount(transaction.amount, transaction.type)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <span className={getStatusBadge(transaction.status)}>
                    {getStatusIcon(transaction.status)}
                    {transaction.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Request Date</label>
                <p className="text-sm">{new Date(transaction.created_at).toLocaleString()}</p>
              </div>

              {rawData?.processed_at && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Processed Date</label>
                  <p className="text-sm">{new Date(rawData.processed_at).toLocaleString()}</p>
                </div>
              )}

              {rawData?.admin_screenshot_url && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Proof by Admin</label>
                  <button
                    onClick={() => window.open(rawData.admin_screenshot_url, '_blank')}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors mt-1"
                  >
                    <CameraIcon className="h-4 w-4" />
                    View Payment Screenshot
                  </button>
                </div>
              )}
            </div>
          </div>

          {rawData?.method_iban && (
            <div className="border-t pt-4">
              <label className="text-sm font-medium text-gray-500">IBAN</label>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-sm bg-gray-100 p-2 rounded">{rawData.method_iban}</span>
                <button 
                  onClick={() => copyToClipboard(rawData.method_iban)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <DocumentTextIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )
    }

    return <div>Transaction details not available</div>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Loading transactions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/50 to-transparent"></div>
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: [
              'radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 75% 75%, rgba(147, 197, 253, 0.1) 0%, transparent 50%)'
            ].join(', ')
          }}
        ></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <ArrowsRightLeftIcon className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 bg-clip-text text-transparent">
              Transaction History
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            View all your deposits and withdrawals in one place
          </p>
        </motion.div>

        {/* Currency Selection */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="bg-white rounded-2xl p-2 shadow-lg border border-blue-200">
            <div className="flex">
              <button
                onClick={() => setCurrencyFilter('usdt')}
                className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                  currencyFilter === 'usdt'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <CurrencyDollarIcon className="h-6 w-6" />
                <span className="text-lg">USDT History</span>
              </button>
              <button
                onClick={() => setCurrencyFilter('pkr')}
                className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                  currencyFilter === 'pkr'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <BanknotesIcon className="h-6 w-6" />
                <span className="text-lg">PKR History</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-200"
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Type Filter */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Transaction Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as FilterType)}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2 text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="all">All Types</option>
                <option value="deposits">Deposits Only</option>
                <option value="withdrawals">Withdrawals Only</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2 text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2 text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="all">All Time</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 bg-white border border-gray-300 rounded-xl px-4 py-2 text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200">
            <span className="text-gray-600 text-sm">
              Showing {filteredTransactions.length} of {transactions.filter(t => t.type.includes(currencyFilter)).length} {currencyFilter.toUpperCase()} transactions
            </span>
            {(typeFilter !== 'all' || statusFilter !== 'all' || searchQuery || dateRange !== 'all') && (
              <button
                onClick={() => {
                  setTypeFilter('all')
                  setStatusFilter('all')
                  setSearchQuery('')
                  setDateRange('all')
                }}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        </motion.div>

        {/* Transactions List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-200"
        >
          {error ? (
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 text-lg">{error}</p>
              <button
                onClick={fetchTransactions}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <ArrowsRightLeftIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No {currencyFilter.toUpperCase()} transactions found</p>
              <p className="text-gray-500 text-sm mt-2">
                {transactions.filter(t => t.type.includes(currencyFilter)).length === 0 
                  ? `You haven't made any ${currencyFilter.toUpperCase()} transactions yet` 
                  : "Try adjusting your filters"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredTransactions.map((transaction, index) => {
                  const safeKey = transaction.id && 
                                  transaction.id !== 'undefined' && 
                                  transaction.id !== 'null' && 
                                  String(transaction.id).trim() !== '' 
                    ? transaction.id 
                    : `${transaction.type}_${transaction.amount}_${Date.parse(transaction.created_at)}_${index}`
                  
                  return (
                    <motion.div
                      key={safeKey}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                      onClick={() => handleTransactionClick(transaction)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {getCurrencyIcon(transaction.type)}
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div>
                            <h3 className="text-gray-800 font-medium">
                              {transaction.description}
                            </h3>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-gray-500 text-sm">
                                {new Date(transaction.created_at).toLocaleString()}
                              </span>
                              {transaction.tx_id && (
                                <span className="text-gray-400 text-xs font-mono">
                                  ID: {transaction.tx_id.slice(0, 8)}...
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-lg font-bold ${
                              transaction.type.includes('deposit') ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type.includes('deposit') ? '+' : '-'}
                              {formatAmount(transaction.amount, transaction.type)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={getStatusBadge(transaction.status)}>
                              {getStatusIcon(transaction.status)}
                              {transaction.status}
                            </span>
                          </div>
                          {transaction.fee && transaction.fee > 0 && (
                            <p className="text-gray-500 text-xs mt-1">
                              Fee: {formatAmount(transaction.fee, transaction.type)}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {showModal && selectedTransaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getCurrencyIcon(selectedTransaction.type)}
                    {getTransactionIcon(selectedTransaction.type)}
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Transaction Details
                      </h2>
                      <p className="text-gray-600">
                        {selectedTransaction.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {renderTransactionDetails(selectedTransaction)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 