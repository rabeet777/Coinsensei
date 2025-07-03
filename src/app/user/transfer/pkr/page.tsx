'use client'

import React, { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import RequireKYC from '@/components/RequireKYC'
import SecurityGuard from '@/components/SecurityGuard'
import { 
  ArrowRightLeft, 
  Shield, 
  CheckCircle, 
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Wallet,
  User,
  Copy,
  Send,
  UserCheck,
  Hash
} from 'lucide-react'

interface RecipientInfo {
  id: string
  full_name: string | null
  phone_number: string | null
  address: string
  avatar_url: string | null
}

export default function TransferPKRPage() {
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  const [balance, setBalance] = useState<number>(0)
  const [locked, setLocked] = useState<number>(0)
  const [myAddress, setMyAddress] = useState<string>('')
  const [isLocked, setIsLocked] = useState<boolean>(false)
  const [step, setStep] = useState<'form' | 'security' | 'confirm' | 'success'>('form')
  const [amount, setAmount] = useState<string>('')
  const [recipientAddress, setRecipientAddress] = useState<string>('')
  const [recipientInfo, setRecipientInfo] = useState<RecipientInfo | null>(null)
  const [notes, setNotes] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [loadingRecipient, setLoadingRecipient] = useState(false)
  const [showSecurityGuard, setShowSecurityGuard] = useState(false)
  const [transferResult, setTransferResult] = useState<any>(null)

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  }

  // Load wallet data and user's own address
  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.replace('/auth/login')
        return
      }
      
      try {
        // Check if account is locked
        const { data: profile } = await supabase
          .from('user_profile')
          .select('is_locked')
          .eq('uid', session.user.id)
          .single()
        if (profile) {
          setIsLocked(profile.is_locked || false)
        }
        
        // Get wallet info including address
        const { data: wallet } = await supabase
          .from('user_pkr_wallets')
          .select('balance, locked_balance, address')
          .eq('user_id', session.user.id)
          .single()
          
        if (wallet) {
          setBalance(Number(wallet.balance))
          setLocked(Number(wallet.locked_balance))
          
          // If no address exists, generate one
          if (!wallet.address) {
            const newAddress = await generateUserAddress(session.user.id)
            setMyAddress(newAddress)
          } else {
            setMyAddress(wallet.address)
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoadingData(false)
      }
    })()
  }, [router, supabase])

  // Generate unique address for user if they don't have one
  const generateUserAddress = async (userId: string): Promise<string> => {
    // Call the database function to ensure user has an address
    const { data, error } = await supabase.rpc('ensure_user_pkr_address', {
      user_id: userId
    })
    
    if (error) {
      console.error('Error generating address:', error)
      // Fallback: generate locally if function fails
      const timestamp = Date.now()
      const randomSuffix = Math.floor(Math.random() * 999999).toString().padStart(6, '0')
      const newAddress = (timestamp % 10000).toString().padStart(4, '0') + randomSuffix
      
      await supabase
        .from('user_pkr_wallets')
        .update({ address: newAddress })
        .eq('user_id', userId)
      
      return newAddress
    }
    
    return data
  }

  // Validate recipient address
  const validateRecipient = async (address: string) => {
    if (!address || address.length < 8) return
    
    setLoadingRecipient(true)
    setError(null)
    
    try {
      // First get the wallet
      const { data: wallet } = await supabase
        .from('user_pkr_wallets')
        .select('user_id, address')
        .eq('address', address)
        .single()
      
      if (wallet) {
        // Then get the user profile
        const { data: profile } = await supabase
          .from('user_profile')
          .select('full_name, phone_number, avatar_url')
          .eq('uid', wallet.user_id)
          .single()
        
        setRecipientInfo({
          id: wallet.user_id,
          full_name: profile?.full_name || null,
          phone_number: profile?.phone_number || null,
          address: wallet.address,
          avatar_url: profile?.avatar_url || null
        })
      } else {
        setRecipientInfo(null)
        setError('Recipient address not found')
      }
    } catch (error) {
      console.error('Error validating recipient:', error)
      setRecipientInfo(null)
      setError('Error validating recipient address')
    } finally {
      setLoadingRecipient(false)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!recipientAddress.trim()) {
      setError('Please enter recipient address')
      return
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }
    
    if (parseFloat(amount) < 100) {
      setError('Minimum transfer amount is PKR 100')
      return
    }
    
    if (parseFloat(amount) > balance) {
      setError('Insufficient balance')
      return
    }
    
    if (recipientAddress === myAddress) {
      setError('Cannot transfer to your own address')
      return
    }

    // Validate recipient before proceeding
    await validateRecipient(recipientAddress)
    if (!recipientInfo) {
      setError('Please enter a valid recipient address')
      return
    }

    // Show security guard for verification
    setShowSecurityGuard(true)
  }

  // Handle security verification success
  const handleSecuritySuccess = async () => {
    setShowSecurityGuard(false)
    setLoading(true)
    
    try {
      const response = await fetch('/api/user/transfer/pkr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientAddress: recipientAddress,
          amount: parseFloat(amount),
          notes: notes.trim() || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Transfer failed')
      }

      // Update local balance
      setBalance(data.newBalance)
      setTransferResult(data)
      setStep('success')
      
      // Reset form
      setAmount('')
      setRecipientAddress('')
      setRecipientInfo(null)
      setNotes('')
      
    } catch (error: any) {
      console.error('Transfer error:', error)
      setError(error.message || 'Transfer failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle security verification cancel
  const handleSecurityCancel = () => {
    setShowSecurityGuard(false)
  }

  // Watch recipient address changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (recipientAddress && recipientAddress.length >= 8) {
        validateRecipient(recipientAddress)
      } else {
        setRecipientInfo(null)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [recipientAddress])

  return (
    <RequireKYC>
      <SecurityGuard
        isOpen={showSecurityGuard}
        onClose={() => setShowSecurityGuard(false)}
        onSuccess={handleSecuritySuccess}
        onCancel={handleSecurityCancel}
        title="Verify Transfer"
        description="Please verify your identity to complete this PKR transfer."
        requireMinimumMethods={1}
      >
        <div />
      </SecurityGuard>
      
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
                  Transfer PKR
                </h1>
                <p className="text-gray-600 mt-1">Send PKR to other CoinSensei users</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
          {loadingData ? (
            <div className="flex items-center justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
              />
              <span className="ml-3 text-gray-600">Loading...</span>
            </div>
          ) : (
            <>
              {/* Balance Overview */}
              <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white/20 p-3 rounded-xl">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">PKR Wallet Balance</h2>
                      <p className="text-blue-100">Available for transfer</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-blue-100 text-sm mb-1">Available Balance</p>
                      <p className="text-3xl font-bold">₨{balance.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-blue-100 text-sm mb-1">Your PKR Address</p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-white/20 px-2 py-1 rounded">{myAddress}</code>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(myAddress)}
                          className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-center">
                    <Button 
                      variant="outline"
                      onClick={() => router.push('/user/transfer/pkr/history')}
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                      <Hash className="h-4 w-4 mr-2" />
                      View Transfer History
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Success Message */}
              <AnimatePresence>
                {step === 'success' && transferResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mb-6"
                  >
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <CheckCircle className="h-8 w-8 text-green-600" />
                          <div>
                            <h3 className="text-lg font-semibold text-green-800">Transfer Successful!</h3>
                            <p className="text-green-600">Your PKR has been sent successfully</p>
                          </div>
                        </div>
                        <div className="bg-white/50 p-4 rounded-lg space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-green-700">Amount:</span>
                            <span className="font-medium">₨{transferResult.details.amount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-green-700">To:</span>
                            <span className="font-mono text-xs">{transferResult.details.recipientAddress}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-green-700">New Balance:</span>
                            <span className="font-medium">₨{transferResult.newBalance.toLocaleString()}</span>
                          </div>
                          {transferResult.details.notes && (
                            <div className="flex justify-between text-sm">
                              <span className="text-green-700">Notes:</span>
                              <span className="text-right max-w-48 truncate">{transferResult.details.notes}</span>
                            </div>
                          )}
                        </div>
                        <Button 
                          onClick={() => setStep('form')}
                          className="w-full mt-4 bg-green-600 hover:bg-green-700"
                        >
                          Make Another Transfer
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

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
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">{error}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Transfer Form */}
              {step === 'form' && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="h-5 w-5 text-blue-600" />
                      Send PKR to Another User
                    </CardTitle>
                    <CardDescription>
                      Enter recipient address and amount to transfer PKR instantly
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Recipient PKR Address
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={recipientAddress}
                            onChange={(e) => setRecipientAddress(e.target.value)}
                            placeholder="Enter recipient's PKR address (e.g., 4465001040)"
                            disabled={isLocked || loading}
                            className="w-full px-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed font-mono"
                            required
                          />
                          {loadingRecipient && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                        
                        {/* Recipient Info */}
                        {recipientInfo && (
                          <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-3 mb-3">
                              <UserCheck className="h-5 w-5 text-green-600" />
                              <span className="font-medium text-green-800">Recipient Found</span>
                            </div>
                            <div className="flex items-center gap-4">
                              {/* Avatar */}
                              <div className="flex-shrink-0">
                                {recipientInfo.avatar_url ? (
                                  <img
                                    src={recipientInfo.avatar_url}
                                    alt="Recipient Avatar"
                                    className="w-12 h-12 rounded-full object-cover border-2 border-green-300"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center border-2 border-green-300">
                                    <User className="h-6 w-6 text-green-600" />
                                  </div>
                                )}
                              </div>
                              
                              {/* User Info */}
                              <div className="flex-1 min-w-0">
                                {recipientInfo.full_name ? (
                                  <p className="font-semibold text-green-800 text-lg truncate">
                                    {recipientInfo.full_name}
                                  </p>
                                ) : (
                                  <p className="font-medium text-green-700">
                                    CoinSensei User
                                  </p>
                                )}
                                <p className="text-sm text-green-600 font-mono truncate">
                                  {recipientInfo.address}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Transfer Amount (PKR)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                            ₨
                          </span>
                          <input
                            type="number"
                            step="any"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount (min. 100)"
                            min="100"
                            max={balance}
                            disabled={isLocked || loading}
                            className="w-full pl-10 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                            required
                          />
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-sm text-gray-500">
                            Minimum: ₨100
                          </p>
                          <p className="text-sm text-gray-500">
                            Maximum: ₨{balance.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes (Optional)
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add a note for this transfer..."
                          disabled={isLocked || loading}
                          maxLength={200}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">{notes.length}/200 characters</p>
                      </div>

                      {amount && parseFloat(amount) > 0 && (
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-2">Transfer Preview</h4>
                          <div className="space-y-1 text-sm text-blue-800">
                            <div className="flex justify-between">
                              <span>Amount:</span>
                              <span>₨{parseFloat(amount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Transfer Fee:</span>
                              <span>₨0</span>
                            </div>
                            <div className="border-t border-blue-200 pt-1 mt-2">
                              <div className="flex justify-between font-semibold">
                                <span>Total Deduction:</span>
                                <span>₨{parseFloat(amount || '0').toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-4">
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => router.push('/user/dashboard')}
                          className="flex-1"
                          disabled={loading}
                        >
                          Back to Dashboard
                        </Button>
                        <Button 
                          type="submit"
                          disabled={!recipientAddress || !amount || parseFloat(amount) < 100 || parseFloat(amount) > balance || loading || isLocked}
                          className="flex-1"
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4 mr-2" />
                              Transfer PKR
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </RequireKYC>
  )
} 