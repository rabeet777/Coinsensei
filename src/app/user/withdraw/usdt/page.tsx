'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import RequireKYC from '@/components/RequireKYC'
import SecurityVerification from '@/components/SecurityVerification'
import { 
  DollarSign, 
  CreditCard, 
  Shield, 
  CheckCircle, 
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Wallet,
  ExternalLink,
  Copy,
  Check,
  Send,
  TrendingDown,
  Lock
} from 'lucide-react'

export default function WithdrawUSDTPage() {
  const supabase = useSupabaseClient()
  const user = useUser()
  const router = useRouter()

  const [toAddress, setToAddress] = useState('')
  const [amount, setAmount] = useState<number>(0)
  const [balance, setBalance] = useState<number>(0)
  const [isLocked, setIsLocked] = useState<boolean>(false)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [txId, setTxId] = useState<string | null>(null)
  const [step, setStep] = useState<'form' | 'security' | 'processing' | 'success'>('form')
  const [copied, setCopied] = useState(false)
  const [isInternalTransfer, setIsInternalTransfer] = useState<boolean>(false)
  const [checkingAddress, setCheckingAddress] = useState<boolean>(false)

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  }

  // Load user balance
  useEffect(() => {
    async function loadBalance() {
      if (!user) return

      try {
        // Check if withdrawals are locked
        const { data: profile } = await supabase
          .from('user_profile')
          .select('is_locked')
          .eq('uid', user.id)
          .single()
        if (profile) {
          setIsLocked(profile.is_locked || false)
        }

        const { data } = await supabase
          .from('user_wallets')
          .select('total_balance')
          .eq('user_id', user.id)
          .single()

        if (data) {
          setBalance(Number(data.total_balance) || 0)
        }
      } catch (error) {
        console.error('Error loading balance:', error)
      } finally {
        setLoadingData(false)
      }
    }

    loadBalance()
  }, [user, supabase])

  // Copy to clipboard function
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  // Check if address is internal (belongs to our platform)
  const checkIfInternalAddress = async (address: string) => {
    if (!address || address.length !== 34 || !address.startsWith('T')) {
      setIsInternalTransfer(false)
      return
    }

    setCheckingAddress(true)
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('address')
        .eq('address', address)
        .maybeSingle()

      if (error) {
        console.error('Error checking address:', error)
        setIsInternalTransfer(false)
      } else {
        setIsInternalTransfer(!!data)
      }
    } catch (error) {
      console.error('Error checking address:', error)
      setIsInternalTransfer(false)
    } finally {
      setCheckingAddress(false)
    }
  }

  // Check address when toAddress changes
  useEffect(() => {
    if (toAddress && toAddress.length === 34 && toAddress.startsWith('T')) {
      checkIfInternalAddress(toAddress)
    } else {
      setIsInternalTransfer(false)
    }
  }, [toAddress])

  // Calculate fees
  const networkFee = isInternalTransfer ? 0 : 1
  const totalCost = amount + networkFee

  // Validate and go to security verification
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    
    // Check if withdrawals are locked
    if (isLocked) {
      setError('Withdrawals are currently locked for your account. Please contact support.')
      return
    }
    
    if (!toAddress || amount <= 0) {
      setError('Please fill in all fields')
      return
    }
    
    if (amount < 1) {
      setError('Minimum withdrawal amount is 1 USDT')
      return
    }

    if (totalCost > balance) {
      setError(`Insufficient balance. You need ${totalCost.toFixed(6)} USDT (including ${networkFee} USDT fee)`)
      return
    }

    if (!toAddress.startsWith('T') || toAddress.length !== 34) {
      setError('Please enter a valid TRON address (starts with T)')
      return
    }
    
    setStep('security')
  }

  // Process withdrawal after security verification
  async function processWithdrawal() {
    setError(null)
    setLoading(true)
    
    // 🚀 IMMEDIATE FEEDBACK: Show processing state right away
    setStep('processing')

    try {
      const resp = await fetch('/api/trc20/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toAddress, amount })
      })
      const data = await resp.json()

      if (!resp.ok) {
        // If API fails, go back to security step and show error
        setStep('security')
        setError(data.error || 'Withdrawal failed. Please try again.')
        return
      }
      
      // Set transaction ID for success screen
      setTxId(data.txId || data.clientProvidedId || `tx_${Date.now()}`)
      
      // Auto-progress to success after a short delay
      setTimeout(() => {
      setStep('success')
        router.refresh() // Refresh to update balances
      }, isInternalTransfer ? 2000 : 3000) // Shorter delay since we're already in processing
      
    } catch (err) {
      // If network error, go back to security step and show error
      setStep('security')
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
        />
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <RequireKYC>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-gray-600 mb-4">Please log in to withdraw USDT</p>
              <Button onClick={() => router.push('/auth/login')}>
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </RequireKYC>
    )
  }

  const stepIndicators = [
    { title: 'Details', icon: Send, step: 'form' },
    { title: 'Security', icon: Shield, step: 'security' },
    { title: 'Complete', icon: CheckCircle, step: 'processing' }
  ]

  const currentStepIndex = stepIndicators.findIndex(s => s.step === step)

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
                  Withdraw USDT
                </h1>
                <p className="text-gray-600 mt-1">Send USDT to external wallet (TRC-20)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Progress Steps - Only show during form and security steps */}
          {!['processing', 'success'].includes(step) && (
            <Card className="border-0 shadow-md mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  {stepIndicators.map((stepInfo, index) => (
                    <div key={stepInfo.step} className="flex items-center">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                        index <= currentStepIndex 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}>
                        <stepInfo.icon className="h-5 w-5" />
                      </div>
                      <div className="ml-3 hidden sm:block">
                        <p className={`text-sm font-medium ${
                          index <= currentStepIndex ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                          Step {index + 1}
                        </p>
                        <p className={`text-xs ${
                          index <= currentStepIndex ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {stepInfo.title}
                        </p>
                      </div>
                      {index < stepIndicators.length - 1 && (
                        <div className={`hidden sm:block w-16 h-0.5 ml-6 ${
                          index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-300'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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

          <AnimatePresence mode="wait">
            {/* STEP 1: Form */}
            {step === 'form' && (
              <motion.div key="form" {...fadeInUp} className="space-y-6">
                {/* Balance Overview */}
                <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-white/20 p-3 rounded-xl">
                        <Wallet className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">USDT Wallet Balance</h2>
                        <p className="text-blue-100">Available for withdrawal</p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-blue-100 text-sm mb-1">Available Balance</p>
                        <p className="text-3xl font-bold">{balance.toFixed(6)} USDT</p>
                      </div>
                      <div>
                        <p className="text-blue-100 text-sm mb-1">Network</p>
                        <p className="text-xl font-semibold">TRON (TRC-20)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Withdrawal Locked Warning */}
                {isLocked && (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-red-200 p-3 rounded-xl">
                          <Lock className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-red-900">Withdrawals Locked</h3>
                          <p className="text-red-700">Your withdrawal access has been restricted. Please contact support for assistance.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Withdrawal Form */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-blue-600" />
                      Withdrawal Details
                    </CardTitle>
                    <CardDescription>
                      Enter destination address and amount
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Destination TRON Address (TRC-20)
                        </label>
                <input
                  type="text"
                  value={toAddress}
                          onChange={(e) => setToAddress(e.target.value)}
                          placeholder="Enter TRON address (starts with T)"
                  required
                          disabled={isLocked}
                          className="w-full px-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        
                        {/* Address validation feedback */}
                        {toAddress && toAddress.length === 34 && toAddress.startsWith('T') && (
                          <div className="mt-2 flex items-center gap-2">
                            {checkingAddress ? (
                              <div className="flex items-center gap-2 text-gray-600">
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                                <span className="text-sm">Checking address...</span>
                              </div>
                            ) : (
                              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                                isInternalTransfer 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {isInternalTransfer ? (
                                  <>
                                    <div className="w-2 h-2 bg-green-600 rounded-full" />
                                    Internal Transfer (Platform User)
                                  </>
                                ) : (
                                  <>
                                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                    External Transfer
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <p className="text-sm text-gray-500 mt-2">
                          ⚠️ Make sure this is a valid TRON address. USDT sent to wrong address cannot be recovered.
                        </p>
              </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amount (USDT)
                        </label>
                        <div className="relative">
                <input
                  type="number"
                            value={amount || ''}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            placeholder="Enter amount (min. 1 USDT)"
                            required
                            min="1"
                            max={balance}
                  step="0.000001"
                            disabled={isLocked}
                            className="w-full pl-4 pr-20 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                            USDT
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-sm text-gray-500">
                            Minimum: 1 USDT
                          </p>
                          <Button 
                            type="button"
                            variant="outline" 
                            size="sm"
                            disabled={isLocked}
                            onClick={() => setAmount(balance)}
                          >
                            Max: {balance.toFixed(6)}
                          </Button>
                        </div>
                      </div>

                      {amount > 0 && (
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-2">Transaction Summary</h4>
                          <div className="space-y-1 text-sm text-blue-800">
                            <div className="flex justify-between">
                              <span>Amount:</span>
                              <span>{amount.toFixed(6)} USDT</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Transfer Type:</span>
                              <span>{isInternalTransfer ? 'Internal (Platform User)' : 'External (Blockchain)'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Platform Fee:</span>
                              <span>{networkFee} USDT</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Network:</span>
                              <span>TRON (TRC-20)</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Processing Time:</span>
                              <span>{isInternalTransfer ? 'Instant' : '1-5 minutes'}</span>
                            </div>
                            <div className="border-t border-blue-200 pt-1 mt-2">
                              <div className="flex justify-between font-semibold">
                                <span>Total Cost:</span>
                                <span>{totalCost.toFixed(6)} USDT</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                        <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Important Notice</h4>
                        <ul className="text-sm text-yellow-800 space-y-1">
                          <li>• Only send to TRON (TRC-20) compatible addresses</li>
                          <li>• Double-check the address before confirming</li>
                          <li>• Withdrawals are irreversible once confirmed</li>
                          <li>• Network fees are paid from your TRX balance</li>
                        </ul>
              </div>

                      <Button 
                        type="submit" 
                        disabled={loading || !toAddress || amount <= 0 || totalCost > balance || isLocked}
                        className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {isLocked ? 'Withdrawals Locked' : 'Continue to Security Verification'}
                        {!isLocked && <ArrowRight className="h-5 w-5 ml-2" />}
                      </Button>
            </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STEP 2: Security Verification */}
            {step === 'security' && (
              <motion.div key="security" {...fadeInUp}>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
          <SecurityVerification
            title="Verify USDT Withdrawal"
            description={`Please verify your identity to withdraw ${amount} USDT to ${toAddress.slice(0, 8)}...`}
            onVerificationComplete={processWithdrawal}
            onCancel={() => setStep('form')}
          />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STEP 3: Processing */}
            {step === 'processing' && (
              <motion.div key="processing" {...fadeInUp}>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full"
                      />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      🚀 Processing Your Withdrawal
                    </h2>
                    
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      Your withdrawal of <strong>{amount.toFixed(6)} USDT</strong> is being processed.
                      {isInternalTransfer ? (
                        <span className="block text-green-600 font-medium mt-2">
                          ⚡ Internal transfer - completing instantly!
                        </span>
                      ) : (
                        <span className="block text-blue-600 font-medium mt-2">
                          🔗 Broadcasting to TRON blockchain...
                        </span>
                      )}
                    </p>
                    
                    <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
                      <h3 className="font-semibold text-blue-900 mb-2">Transaction Details</h3>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p><strong>Amount:</strong> {amount.toFixed(6)} USDT</p>
                        <p><strong>Fee:</strong> {networkFee} USDT</p>
                        <p><strong>Total:</strong> {totalCost.toFixed(6)} USDT</p>
                        <p><strong>To:</strong> {toAddress.slice(0, 20)}...{toAddress.slice(-8)}</p>
                        <p><strong>Type:</strong> {isInternalTransfer ? 'Internal Transfer' : 'Blockchain Transfer'}</p>
                        <p><strong>Network:</strong> TRON (TRC-20)</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span><strong>Status:</strong> Processing...</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-lg mb-6 text-left">
                      <h3 className="font-semibold text-yellow-900 mb-2">⏳ What's Happening?</h3>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        {isInternalTransfer ? (
                          <>
                            <li>• Verifying your withdrawal request</li>
                            <li>• Updating account balances</li>
                            <li>• Completing internal transfer</li>
                          </>
                        ) : (
                          <>
                            <li>• Verifying your withdrawal request</li>
                            <li>• Creating blockchain transaction</li>
                            <li>• Broadcasting to TRON network</li>
                            <li>• Waiting for network confirmation</li>
                          </>
                        )}
                      </ul>
                    </div>
                    
                    {/* Progress indicator */}
                    <div className="bg-gray-200 rounded-full h-2 mb-6">
                      <motion.div
                        className="bg-blue-600 h-2 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "90%" }}
                        transition={{ duration: isInternalTransfer ? 2 : 3, ease: "easeOut" }}
                      />
                    </div>
                    
                    <p className="text-sm text-gray-500 mb-4">
                      Please don't close this window. You'll be redirected automatically once complete.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STEP 4: Success */}
            {step === 'success' && (
              <motion.div key="success" {...fadeInUp}>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      {isInternalTransfer ? '✅ Transfer Completed!' : '🚀 Withdrawal Successful!'}
                    </h2>
                    
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {isInternalTransfer ? (
                        <>Your transfer of <strong>{amount.toFixed(6)} USDT</strong> has been completed instantly to another platform user.</>
                      ) : (
                        <>Your withdrawal of <strong>{amount.toFixed(6)} USDT</strong> has been successfully submitted to the TRON network.</>
                      )}
                    </p>
                    
                    {txId && (
                      <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <h3 className="font-semibold text-gray-900 mb-2">Transaction ID</h3>
                        <div className="flex items-center gap-2 bg-white p-3 rounded border">
                          <code className="text-sm font-mono text-gray-700 flex-1 break-all">
                            {txId}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(txId)}
                          >
                            {copied ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`https://nile.tronscan.org/#/transaction/${txId}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View on Tronscan
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
                      <h3 className="font-semibold text-blue-900 mb-2">Transaction Details</h3>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p><strong>Amount:</strong> {amount.toFixed(6)} USDT</p>
                        <p><strong>Platform Fee:</strong> {networkFee} USDT</p>
                        <p><strong>Total Cost:</strong> {totalCost.toFixed(6)} USDT</p>
                        <p><strong>To:</strong> {toAddress}</p>
                        <p><strong>Type:</strong> {isInternalTransfer ? 'Internal Transfer' : 'External Withdrawal'}</p>
                        <p><strong>Network:</strong> TRON (TRC-20)</p>
                        <p><strong>Status:</strong> {isInternalTransfer ? 'Completed' : 'Submitted to blockchain'}</p>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-lg mb-6 text-left">
                      <h3 className="font-semibold text-yellow-900 mb-2">What's Next?</h3>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        {isInternalTransfer ? (
                          <>
                            <li>✅ Transfer completed instantly</li>
                            <li>✅ Recipient's balance updated</li>
                            <li>✅ Transaction recorded in both accounts</li>
                            <li>• Check your transaction history for records</li>
                          </>
                        ) : (
                          <>
                            <li>• Your transaction is being processed by the TRON network</li>
                            <li>• It may take a few minutes to confirm</li>
                            <li>• You can track the status on Tronscan using the TX ID above</li>
                            <li>• The recipient will receive the USDT once confirmed</li>
                          </>
                        )}
                      </ul>
                    </div>
                    
                    <Button 
              onClick={() => router.push('/user/dashboard')}
                      className="w-full bg-green-600 hover:bg-green-700"
            >
              Back to Dashboard
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
      </div>
    </RequireKYC>
  )
}
