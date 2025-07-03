'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { QRCodeSVG } from 'qrcode.react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/lib/database.types'
import { 
  ArrowLeft,
  Copy,
  Check,
  AlertTriangle,
  Shield,
  Wallet,
  QrCode,
  ExternalLink,
  Info,
  Clock,
  TrendingUp,
  Eye,
  AlertCircle
} from 'lucide-react'
import RequireKYC from '@/components/RequireKYC'

export default function USDTDepositPage() {
  const router = useRouter()
  const session = useSession()
  const supabase = useSupabaseClient<Database>()

  const [address, setAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<boolean>(false)
  const [showFullAddress, setShowFullAddress] = useState<boolean>(false)

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  }

  useEffect(() => {
    if (!session) {
      setLoading(false)
      return
    }

    const fetchAddress = async () => {
      setLoading(true)
      setError(null)

      try {
      const { data, error: dbError } = await supabase
        .from('user_wallets')
        .select('address')
        .eq('user_id', session.user.id)
        .single()

      if (dbError) {
          throw new Error(dbError.message)
      }
        
      if (!data?.address) {
          throw new Error('No USDT deposit address found for your account.')
        }

        setAddress(data.address)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAddress()
  }, [session, supabase])

  const copyToClipboard = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy: ', err)
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = address
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  const formatAddress = (addr: string) => {
    if (!addr) return ''
    if (showFullAddress) return addr
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
        />
        <span className="ml-3 text-gray-600">Loading your deposit address...</span>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please log in to view your USDT deposit address</p>
            <Button onClick={() => router.push('/auth/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

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
                  USDT Deposit
                </h1>
                <p className="text-gray-600 mt-1">Deposit USDT to your wallet via TRON network</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
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
      {address && (
              <motion.div key="deposit-content" {...fadeInUp} className="space-y-8">
                {/* Deposit Address Card */}
                <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-white/20 p-3 rounded-xl">
                        <Wallet className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Your USDT Deposit Address</h2>
                        <p className="text-blue-100">TRON Network (TRC-20)</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      {/* QR Code */}
                      <div className="flex justify-center">
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <QRCodeSVG 
                            value={address} 
                            size={200}
                            bgColor="#ffffff"
                            fgColor="#1e40af"
                            level="M"
                            includeMargin={true}
                          />
                        </div>
                      </div>

                      {/* Address Details */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-blue-100 text-sm mb-2">Deposit Address</p>
                          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <div className="flex items-center gap-2 mb-3">
                              <QrCode className="h-4 w-4 text-blue-200" />
                              <span className="text-blue-100 text-sm">TRC-20 Address</span>
                            </div>
                            <p className="font-mono text-lg break-all mb-3">
                              {formatAddress(address)}
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setShowFullAddress(!showFullAddress)}
                                className="px-3 py-1.5 text-sm font-medium text-white bg-white/20 hover:bg-white/30 active:bg-white/40 border border-white/30 rounded-lg transition-all duration-200 flex items-center gap-1"
                              >
                                <Eye className="h-4 w-4" />
                                {showFullAddress ? 'Hide' : 'Show'} Full
                              </button>
          <button
            onClick={copyToClipboard}
                                className={`px-3 py-1.5 text-sm font-medium border rounded-lg transition-all duration-200 flex items-center gap-1 ${
                                  copied 
                                    ? 'text-green-300 bg-green-500/20 hover:bg-green-500/30 border-green-400/50' 
                                    : 'text-white bg-white/20 hover:bg-white/30 active:bg-white/40 border-white/30'
                                }`}
                              >
                                {copied ? (
                                  <>
                                    <Check className="h-4 w-4" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-4 w-4" />
                                    Copy
                                  </>
                                )}
          </button>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-4 w-4 text-green-300" />
                            <span className="text-green-200 text-sm font-medium">Network Information</span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-blue-200">Network:</span>
                              <span className="text-white font-medium">TRON (TRC-20)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-200">Token:</span>
                              <span className="text-white font-medium">USDT</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-200">Min Deposit:</span>
                              <span className="text-white font-medium">1 USDT</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Instructions */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Deposit Instructions */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-blue-600" />
                        How to Deposit
                      </CardTitle>
                      <CardDescription>
                        Follow these steps to deposit USDT safely
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                            1
                          </div>
                          <div>
                            <p className="font-medium">Copy the address or scan QR code</p>
                            <p className="text-sm text-gray-600">Use the copy button or scan QR with your wallet app</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                            2
                          </div>
                          <div>
                            <p className="font-medium">Send USDT from your wallet</p>
                            <p className="text-sm text-gray-600">Use TRON network (TRC-20) only</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                            3
                          </div>
                          <div>
                            <p className="font-medium">Wait for confirmation</p>
                            <p className="text-sm text-gray-600">Usually takes 1-5 minutes on TRON network</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                            4
                          </div>
                          <div>
                            <p className="font-medium">Funds appear in your balance</p>
                            <p className="text-sm text-gray-600">Check your wallet balance after confirmation</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Important Information */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        Important Information
                      </CardTitle>
                      <CardDescription>
                        Please read carefully before depositing
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h4 className="font-semibold text-amber-900 mb-2">⚠️ Network Requirements</h4>
                        <ul className="text-sm text-amber-800 space-y-1">
                          <li>• Only send USDT via TRON network (TRC-20)</li>
                          <li>• Do not send from Ethereum or other networks</li>
                          <li>• Minimum deposit amount: 1 USDT</li>
                          <li>• Network fee: ~1-5 TRX (paid by sender)</li>
                        </ul>
                      </div>

                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-semibold text-red-900 mb-2">🚫 Do Not Send</h4>
                        <ul className="text-sm text-red-800 space-y-1">
                          <li>• Other cryptocurrencies (BTC, ETH, etc.)</li>
                          <li>• USDT from Ethereum or Binance networks</li>
                          <li>• Amounts less than 1 USDT</li>
                          <li>• From exchanges that don't support TRC-20</li>
                        </ul>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tips</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Always test with small amounts first</li>
                          <li>• Double-check the address before sending</li>
                          <li>• Keep transaction hash for reference</li>
                          <li>• Contact support if deposit is delayed</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Transaction Status */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-green-600" />
                      Deposit Status & Timing
                    </CardTitle>
                    <CardDescription>
                      Track your deposit progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                          <TrendingUp className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="font-semibold mb-1">Transaction Sent</h3>
                        <p className="text-sm text-gray-600">Your transaction is broadcasted to TRON network</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                          <Shield className="h-8 w-8 text-yellow-600" />
                        </div>
                        <h3 className="font-semibold mb-1">Confirming</h3>
                        <p className="text-sm text-gray-600">Usually takes 1-5 minutes for confirmation</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                          <Check className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="font-semibold mb-1">Completed</h3>
                        <p className="text-sm text-gray-600">Funds are added to your wallet balance</p>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-center">
                      <Button 
                        variant="outline"
                        onClick={() => window.open('https://tronscan.org/', '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Check on TRON Explorer
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Need Help?</h3>
                        <p className="text-gray-600">Our support team is here to assist you</p>
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => router.push('/user/transactions')}>
                          View Transactions
                        </Button>
                        <Button onClick={() => router.push('/user/dashboard')}>
                          Back to Dashboard
                        </Button>
                      </div>
                    </div>
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
