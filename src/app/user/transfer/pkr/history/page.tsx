'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import RequireKYC from '@/components/RequireKYC'
import { 
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Hash,
  FileText,
  Wallet,
  Send,
  Download,
  Filter
} from 'lucide-react'

interface Transfer {
  id: string
  sender_id: string
  recipient_id: string
  amount: number
  notes: string | null
  status: string
  created_at: string
  is_sender: boolean
  other_user_name: string | null
  other_user_address: string
}

type TabType = 'all' | 'sent' | 'received'

export default function PKRTransferHistoryPage() {
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [error, setError] = useState<string | null>(null)

  // Load transfer history
  useEffect(() => {
    const loadTransfers = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.replace('/auth/login')
        return
      }

      setLoading(true)
      try {
        const response = await fetch('/api/user/transfer/pkr/history')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load transfer history')
        }

        setTransfers(data.transfers || [])
      } catch (error: any) {
        console.error('Error loading transfers:', error)
        setError(error.message || 'Failed to load transfer history')
      } finally {
        setLoading(false)
      }
    }

    loadTransfers()
  }, [router, supabase])

  // Filter transfers based on active tab
  const filteredTransfers = transfers.filter(transfer => {
    switch (activeTab) {
      case 'sent':
        return transfer.is_sender
      case 'received':
        return !transfer.is_sender
      default:
        return true
    }
  })

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      })
    }
  }

  // Get transfer stats
  const stats = {
    total: transfers.length,
    sent: transfers.filter(t => t.is_sender).length,
    received: transfers.filter(t => !t.is_sender).length,
    totalSent: transfers.filter(t => t.is_sender).reduce((sum, t) => sum + t.amount, 0),
    totalReceived: transfers.filter(t => !t.is_sender).reduce((sum, t) => sum + t.amount, 0)
  }

  const tabs = [
    { id: 'all' as TabType, label: 'All Transactions', count: stats.total },
    { id: 'sent' as TabType, label: 'Sent', count: stats.sent },
    { id: 'received' as TabType, label: 'Received', count: stats.received }
  ]

  return (
    <RequireKYC>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50/30">
        {/* Header */}
        <div className="bg-white border-b border-blue-100 shadow-sm">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  PKR Transfer History
                </h1>
                <p className="text-gray-600 mt-1">View all your PKR transactions</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
              />
              <span className="ml-3 text-gray-600">Loading transfer history...</span>
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <Card className="border-0 shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-3 rounded-xl">
                        <Download className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-green-100 text-sm">Total Received</p>
                        <p className="text-2xl font-bold">₨{stats.totalReceived.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-r from-red-500 to-red-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-3 rounded-xl">
                        <Send className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-red-100 text-sm">Total Sent</p>
                        <p className="text-2xl font-bold">₨{stats.totalSent.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-3 rounded-xl">
                        <Hash className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-blue-100 text-sm">Total Transactions</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Error Display */}
              {error && (
                <Card className="border-red-200 bg-red-50 mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-red-800">
                      <FileText className="h-5 w-5" />
                      <span className="font-medium">{error}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tabs */}
              <Card className="border-0 shadow-lg mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-blue-600" />
                        Filter Transactions
                      </CardTitle>
                      <CardDescription>
                        Select transaction type to view
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          activeTab === tab.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {tab.label}
                        {tab.count > 0 && (
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            activeTab === tab.id
                              ? 'bg-white/20 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Transfer List */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-blue-600" />
                    {activeTab === 'all' ? 'All Transactions' : 
                     activeTab === 'sent' ? 'Sent Transfers' : 'Received Transfers'}
                  </CardTitle>
                  <CardDescription>
                    {filteredTransfers.length === 0 
                      ? 'No transactions found' 
                      : `${filteredTransfers.length} transaction${filteredTransfers.length !== 1 ? 's' : ''}`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {filteredTransfers.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <Hash className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                      <p className="text-gray-500 mb-6">
                        {activeTab === 'all' 
                          ? "You haven't made any PKR transfers yet."
                          : activeTab === 'sent'
                          ? "You haven't sent any PKR transfers yet."
                          : "You haven't received any PKR transfers yet."
                        }
                      </p>
                      <Button onClick={() => router.push('/user/transfer/pkr')}>
                        <Send className="h-4 w-4 mr-2" />
                        Make Your First Transfer
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence>
                        {filteredTransfers.map((transfer) => {
                          const { date, time } = formatDate(transfer.created_at)
                          const isSent = transfer.is_sender
                          
                          return (
                            <motion.div
                              key={transfer.id}
                              layout
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  {/* Transfer Direction Icon */}
                                  <div className={`p-3 rounded-full ${
                                    isSent 
                                      ? 'bg-red-100 text-red-600' 
                                      : 'bg-green-100 text-green-600'
                                  }`}>
                                    {isSent ? (
                                      <ArrowUpRight className="h-5 w-5" />
                                    ) : (
                                      <ArrowDownLeft className="h-5 w-5" />
                                    )}
                                  </div>
                                  
                                  {/* Transfer Details */}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                                        isSent 
                                          ? 'bg-red-100 text-red-700' 
                                          : 'bg-green-100 text-green-700'
                                      }`}>
                                        {isSent ? 'Sent' : 'Received'}
                                      </span>
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                        {transfer.status}
                                      </span>
                                    </div>
                                    
                                    <p className="text-gray-900 font-medium">
                                      {isSent ? 'To: ' : 'From: '}
                                      {transfer.other_user_name ? (
                                        <span className="text-blue-600">{transfer.other_user_name}</span>
                                      ) : (
                                        <span className="text-gray-600">CoinSensei User</span>
                                      )}
                                    </p>
                                    
                                    <p className="text-sm text-gray-500 font-mono">
                                      Address: {transfer.other_user_address}
                                    </p>
                                    
                                    {transfer.notes && (
                                      <p className="text-sm text-gray-600 mt-1 italic">
                                        "{transfer.notes}"
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Amount and Date */}
                                <div className="text-right">
                                  <p className={`text-lg font-bold ${
                                    isSent ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                    {isSent ? '-' : '+'}₨{transfer.amount.toLocaleString()}
                                  </p>
                                  <div className="text-xs text-gray-500">
                                    <p>{date}</p>
                                    <p>{time}</p>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </RequireKYC>
  )
} 