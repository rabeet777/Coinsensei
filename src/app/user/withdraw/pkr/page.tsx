'use client'

import React, { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
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
  User,
  Building,
  Lock,
  Clock,
  TrendingDown
} from 'lucide-react'

interface Wallet {
  balance: number
  locked_balance: number
}

interface PaymentMethod {
  id: string
  type: string
  bank_name: string | null
  account_number: string
  iban: string
  account_title: string
}

export default function WithdrawPKRPage() {
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  const [balance, setBalance] = useState<number>(0)
  const [locked, setLocked] = useState<number>(0)
  const [isLocked, setIsLocked] = useState<boolean>(false)
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [step, setStep] = useState<'form' | 'security' | 'confirm'>('form')
  const [amount, setAmount] = useState<string>('')
  const [method, setMethod] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  }

  // Load wallet + methods
  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.replace('/auth/login')
        return
      }
      
      try {
        // Check if withdrawals are locked
        const { data: profile } = await supabase
          .from('user_profile')
          .select('is_locked')
          .eq('uid', session.user.id)
          .single()
        if (profile) {
          setIsLocked(profile.is_locked || false)
        }
        
      // wallet
      const { data: w } = await supabase
        .from('user_pkr_wallets')
          .select('total_balance,locked_balance')
        .eq('user_id', session.user.id)
        .single()
      if (w) {
          setBalance(Number(w.total_balance))
        setLocked(Number(w.locked_balance))
      }
        
      // user methods
      const { data: pm } = await supabase
        .from('user_payment_methods')
        .select('id,type,bank_name,account_number,iban,account_title')
        .eq('user_id', session.user.id)
      if (pm) setMethods(pm)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoadingData(false)
      }
    })()
  }, [router, supabase])

  // Submit: validate and go to security verification
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Check if withdrawals are locked
    if (isLocked) {
      setError('Withdrawals are currently locked for your account. Please contact support.')
      return
    }
    
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) {
      setError('Enter a positive amount')
      return
    }
    if (amt < 1000) {
      setError('Minimum withdrawal amount is PKR 1,000')
      return
    }
    if (amt > balance) {
      setError('Exceeds available balance')
      return
    }
    if (!method) {
      setError('Select a payment method')
      return
    }
    setStep('security')
  }

  // Process withdrawal after security verification
  const processWithdrawal = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session!.user!.id
      const amt = parseFloat(amount)

      // Update both balance and locked_balance in the database
      const newBalance = balance - amt
      const newLocked = locked + amt
      
      const { error: updateErr } = await supabase
        .from('user_pkr_wallets')
        .update({ 
          total_balance: newBalance,
          locked_balance: newLocked 
        })
        .eq('user_id', userId)
      if (updateErr) throw updateErr

      // Update local state to reflect the changes
      setBalance(newBalance)
      setLocked(newLocked)

      // Create the withdrawal request
      const pm = methods.find(m => m.id === method)!
      const { error: wErr } = await supabase
        .from('user_pkr_withdrawals')
        .insert([{
          user_id: userId,
          amount: amt,
          method_type: pm.type,
          method_bank_name: pm.bank_name,
          method_account_number: pm.account_number,
          method_iban: pm.iban,
          method_account_title: pm.account_title
        }])
      if (wErr) throw wErr

      setStep('confirm')
    } catch (e: any) {
      setError(e.message)
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

  const stepIndicators = [
    { title: 'Details', icon: DollarSign, step: 'form' },
    { title: 'Security', icon: Shield, step: 'security' },
    { title: 'Confirm', icon: CheckCircle, step: 'confirm' }
  ]

  const currentStepIndex = stepIndicators.findIndex(s => s.step === step)
  const availableBalance = balance
  const selectedMethod = methods.find(m => m.id === method)

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
                  Withdraw PKR
                </h1>
                <p className="text-gray-600 mt-1">Withdraw funds from your PKR wallet</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Progress Steps */}
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
                <Card className="border-0 shadow-lg bg-gradient-to-r from-green-600 to-green-700 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-white/20 p-3 rounded-xl">
                        <Wallet className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">PKR Wallet Balance</h2>
                        <p className="text-green-100">Available for withdrawal</p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-green-100 text-sm mb-1">Available Balance</p>
                        <p className="text-3xl font-bold">₨{availableBalance.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-green-100 text-sm mb-1">Locked Balance</p>
                        <p className="text-xl font-semibold">₨{locked.toLocaleString()}</p>
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
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      Withdrawal Details
                    </CardTitle>
                    <CardDescription>
                      Enter withdrawal amount and select payment method
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Withdrawal Amount (PKR)
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
                            placeholder="Enter amount (min. 1,000)"
                  required
                            min="1000"
                            max={availableBalance}
                            disabled={isLocked}
                            className="w-full pl-10 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-sm text-gray-500">
                            Minimum: ₨1,000
                          </p>
                          <p className="text-sm text-gray-500">
                            Maximum: ₨{availableBalance.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Payment Method
              </label>
                        {methods.length === 0 ? (
                          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 font-medium">No payment methods found</p>
                            <p className="text-gray-500 text-sm">Add a payment method first</p>
                            <Button 
                              variant="outline" 
                              className="mt-3"
                              onClick={() => router.push('/user/payment-methods')}
                            >
                              Add Payment Method
                            </Button>
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            {methods.map((pm) => (
                              <motion.div
                                key={pm.id}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                              >
                                <Card 
                                  className={`cursor-pointer transition-all border-2 ${
                                    method === pm.id 
                                      ? 'border-blue-500 bg-blue-50' 
                                      : 'border-gray-200 hover:border-blue-300'
                                  } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  onClick={() => !isLocked && setMethod(pm.id)}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                      <div className={`p-3 rounded-xl ${
                                        method === pm.id ? 'bg-blue-200' : 'bg-gray-100'
                                      }`}>
                                        <Building className={`h-5 w-5 ${
                                          method === pm.id ? 'text-blue-700' : 'text-gray-600'
                                        }`} />
                                      </div>
                                      <div className="flex-1">
                                        <h3 className="font-semibold">{pm.type}</h3>
                                        {pm.bank_name && (
                                          <p className="text-gray-600 text-sm">{pm.bank_name}</p>
                                        )}
                                        <p className="text-gray-500 text-sm">
                                          {pm.account_number} • {pm.account_title}
                                        </p>
                                      </div>
                                      {method === pm.id && (
                                        <CheckCircle className="h-5 w-5 text-blue-600" />
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>

                      {amount && parseFloat(amount) > 0 && (
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-2">Withdrawal Summary</h4>
                          <div className="space-y-1 text-sm text-blue-800">
                            <div className="flex justify-between">
                              <span>Amount:</span>
                              <span>₨{parseFloat(amount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Processing Fee:</span>
                              <span>₨0</span>
                            </div>
                            <div className="border-t border-blue-200 pt-1 mt-2">
                              <div className="flex justify-between font-semibold">
                                <span>You'll receive:</span>
                                <span>₨{parseFloat(amount || '0').toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button 
                type="submit"
                        disabled={loading || !amount || !method || methods.length === 0 || isLocked}
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
            title="Verify PKR Withdrawal"
            description={`Please verify your identity to withdraw ₨${parseFloat(amount).toLocaleString()}`}
            onVerificationComplete={processWithdrawal}
            onCancel={() => setStep('form')}
          />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STEP 3: Confirmation */}
            {step === 'confirm' && (
              <motion.div key="confirm" {...fadeInUp}>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Withdrawal Request Submitted!
                    </h2>
                    
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      Your withdrawal request for <strong>₨{parseFloat(amount).toLocaleString()}</strong> has been submitted successfully.
                    </p>
                    
                    {selectedMethod && (
                      <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
                        <h3 className="font-semibold text-blue-900 mb-2">Payment Method</h3>
                        <div className="text-sm text-blue-800 space-y-1">
                          <p><strong>Type:</strong> {selectedMethod.type}</p>
                          {selectedMethod.bank_name && (
                            <p><strong>Bank:</strong> {selectedMethod.bank_name}</p>
                          )}
                          <p><strong>Account:</strong> {selectedMethod.account_number}</p>
                          <p><strong>Title:</strong> {selectedMethod.account_title}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-yellow-50 p-4 rounded-lg mb-6 text-left">
                      <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Processing Information
                      </h3>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        <li>• Your request is pending admin approval</li>
                        <li>• Processing time: 1-3 business days</li>
                        <li>• Funds are temporarily locked in your account</li>
                        <li>• You'll receive an email notification when processed</li>
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
