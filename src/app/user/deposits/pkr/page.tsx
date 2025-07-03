// src/app/user/deposits/pkr/page.tsx
'use client'

import React, { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import RequireKYC from '@/components/RequireKYC'
import { 
  DollarSign, 
  CreditCard, 
  Upload, 
  CheckCircle, 
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Camera,
  FileImage,
  Building,
  User,
  Copy,
  Check
} from 'lucide-react'

interface AdminPaymentMethod {
  id: string
  admin_id: string
  type: string
  bank_name: string | null
  account_number: string
  iban: string
  account_title: string
  created_at: string
}

export default function DepositPKRPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loadingSession, setLoadingSession] = useState(true)
  
  const [step, setStep] = useState<'amount' | 'method' | 'proof'>('amount')
  const [amount, setAmount] = useState('')
  const [methods, setMethods] = useState<AdminPaymentMethod[]>([])
  const [methodType, setMethodType] = useState('')
  const [selected, setSelected] = useState<AdminPaymentMethod | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  }

  // Session check useEffect
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/auth/login')
      } else {
        setLoadingSession(false)
      }
    })
  }, [router, supabase])

  // Auto-redirect after 5 seconds useEffect
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        handleSuccessClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showSuccess])

  // Handler functions
  const handleSuccessClose = () => {
    setShowSuccess(false)
    router.push('/user/dashboard')
  }

  if (loadingSession) {
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

  const filtered = methods.filter(m => m.type === methodType)

  // Copy to clipboard function
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  // STEP 1: validate amount & fetch methods
  async function handleAmountSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const p = parseFloat(amount)
    if (isNaN(p) || p <= 0) {
      setError('Enter a valid PKR amount.')
      return
    }
    if (p < 1000) {
      setError('Minimum deposit amount is PKR 1,000.')
      return
    }
    
    const { data, error: mErr } = await supabase
      .from('admin_payment_methods')
      .select('*')
      .order('created_at', { ascending: true })

    if (mErr) {
      setError(`Couldn't load payment options: ${mErr.message}`)
      return
    }
    setMethods(data || [])
    if ((data || []).length) setMethodType(data![0].type)
    setStep('method')
  }

  // STEP 2: pick one
  function handleSelect(m: AdminPaymentMethod) {
    setSelected(m)
    setError(null)
    setStep('proof')
  }

  // STEP 3: upload proof + insert deposit
  async function handleUploadProof() {
    if (!file || !selected) {
      setError('Please attach a screenshot and select a method.')
      return
    }
    setError(null)
    setUploading(true)

    try {
      const { data: { session }, error: sessErr } = await supabase.auth.getSession()
      if (sessErr || !session?.user) throw new Error('Not authenticated')

      // upload image
      const path = `proofs/${session.user.id}_${Date.now()}_${file.name}`
      const { error: upErr } = await supabase
        .storage
        .from('userdepositscreenshot')
        .upload(path, file, { upsert: true })
      if (upErr) throw upErr

      const { data: urlData } = supabase
        .storage
        .from('userdepositscreenshot')
        .getPublicUrl(path)

      // insert deposit
      const { error: depErr } = await supabase
        .from('user_pkr_deposits')
        .insert([{
          user_id: session.user.id,
          amount: parseFloat(amount),
          admin_id: selected.admin_id,
          method_type: selected.type,
          method_bank_name: selected.bank_name,
          method_account_number: selected.account_number,
          method_iban: selected.iban,
          method_account_title: selected.account_title,
          screenshot_url: urlData.publicUrl,
          status: 'pending'
        }])
      if (depErr) throw depErr

      // Show success modal instead of immediate redirect
      setShowSuccess(true)
    } catch (e: any) {
      console.error('upload error', e)
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  const stepIndicators = [
    { title: 'Amount', icon: DollarSign, step: 'amount' },
    { title: 'Method', icon: CreditCard, step: 'method' },
    { title: 'Proof', icon: Upload, step: 'proof' }
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
                  Deposit PKR
                </h1>
                <p className="text-gray-600 mt-1">Add funds to your PKR wallet</p>
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
            {/* Success Modal */}
            {showSuccess && (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
                >
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Request Received!
                  </h2>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Your deposit request for <strong>₨{parseFloat(amount).toLocaleString()}</strong> has been successfully submitted and is being processed by our team.
                  </p>
                  
                  <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
                    <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Our team will verify your payment within 24 hours</li>
                      <li>• You'll receive a notification once approved</li>
                      <li>• Funds will be added to your PKR wallet</li>
                      <li>• Check transaction history for updates</li>
                    </ul>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <Button 
                      onClick={handleSuccessClose}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Continue to Dashboard
                    </Button>
                    <p className="text-xs text-gray-500">
                      Auto-redirecting in a few seconds...
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* STEP 1: Amount */}
            {step === 'amount' && !showSuccess && (
              <motion.div key="amount" {...fadeInUp}>
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Enter Deposit Amount
                    </CardTitle>
                    <CardDescription>
                      Minimum deposit amount is PKR 1,000
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleAmountSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amount (PKR)
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
                            placeholder="Enter amount (e.g. 10,000)"
                    required
                            min="1000"
                            className="w-full pl-10 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          You'll receive: ₨{amount ? parseFloat(amount).toLocaleString() : '0'} in your wallet
                        </p>
                      </div>

                      <Button 
                  type="submit"
                        className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
                        disabled={!amount || parseFloat(amount) < 1000}
                      >
                        Continue to Payment Method
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STEP 2: Method Selection */}
            {step === 'method' && !showSuccess && (
              <motion.div key="method" {...fadeInUp}>
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      Choose Payment Method
                    </CardTitle>
                    <CardDescription>
                      Select your preferred payment method for depositing ₨{parseFloat(amount).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Method Type Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Payment Method Type
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(new Set(methods.map(m => m.type))).map(type => (
                          <Button
                            key={type}
                            variant={methodType === type ? "default" : "outline"}
                            onClick={() => setMethodType(type)}
                            className={methodType === type ? "bg-blue-600 hover:bg-blue-700" : ""}
                          >
                            {type}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Payment Method Cards */}
                    <div className="grid gap-4 md:grid-cols-2">
                      {filtered.map((method) => (
                        <motion.div
                          key={method.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-300">
                            <CardContent className="p-6">
                              <div className="flex items-start gap-3 mb-4">
                                <div className="bg-blue-100 p-3 rounded-xl">
                                  <Building className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg">{method.type}</h3>
                                  {method.bank_name && (
                                    <p className="text-gray-600">{method.bank_name}</p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">Account Number:</span>
                                  <span className="font-mono font-medium">{method.account_number}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">IBAN:</span>
                                  <span className="font-mono font-medium text-xs">{method.iban}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">Account Title:</span>
                                  <span className="font-medium">{method.account_title}</span>
                                </div>
                      </div>
                              
                              <Button
                                onClick={() => handleSelect(method)}
                                className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                              >
                                Select This Method
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                            </CardContent>
                          </Card>
                    </motion.div>
                  ))}
                </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STEP 3: Upload Proof */}
            {step === 'proof' && selected && !showSuccess && (
              <motion.div key="proof" {...fadeInUp} className="space-y-6">
                {/* Payment Details */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Payment Details
                    </CardTitle>
                    <CardDescription>
                      Transfer ₨{parseFloat(amount).toLocaleString()} to the account below
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-200 p-3 rounded-xl">
                          <Building className="h-6 w-6 text-blue-700" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{selected.type}</h3>
                          {selected.bank_name && (
                            <p className="text-gray-700 font-medium">{selected.bank_name}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="bg-white p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Account Number</p>
                              <p className="font-mono font-bold text-lg">{selected.account_number}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(selected.account_number, 'account')}
                            >
                              {copiedField === 'account' ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">IBAN</p>
                              <p className="font-mono font-bold text-sm">{selected.iban}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(selected.iban, 'iban')}
                            >
                              {copiedField === 'iban' ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg md:col-span-2">
                          <div className="flex items-center justify-between">
                  <div>
                              <p className="text-sm text-gray-600">Account Title</p>
                              <p className="font-semibold text-lg">{selected.account_title}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(selected.account_title, 'title')}
                            >
                              {copiedField === 'title' ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                  </div>
                </div>

                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Amount to Transfer:</strong> ₨{parseFloat(amount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Upload Proof */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5 text-purple-600" />
                      Upload Payment Proof
                    </CardTitle>
                    <CardDescription>
                      Upload a screenshot or photo of your payment receipt
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center">
                          {file ? (
                            <>
                              <FileImage className="h-12 w-12 text-green-600 mb-3" />
                              <p className="text-lg font-medium text-green-600">{file.name}</p>
                              <p className="text-sm text-gray-500">Click to change file</p>
                            </>
                          ) : (
                            <>
                              <Camera className="h-12 w-12 text-gray-400 mb-3" />
                              <p className="text-lg font-medium text-gray-900">Click to upload</p>
                              <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                            </>
                          )}
                        </div>
                </label>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Instructions:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Take a clear screenshot of your payment confirmation</li>
                        <li>• Ensure the amount and transaction details are visible</li>
                        <li>• The image should be clear and readable</li>
                      </ul>
                    </div>

                    <Button
                  onClick={handleUploadProof}
                      disabled={!file || uploading}
                      className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {uploading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit Deposit Request
                          <CheckCircle className="h-5 w-5 ml-2" />
                        </>
                      )}
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
