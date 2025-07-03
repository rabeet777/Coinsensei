'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import RequireKYC from '@/components/RequireKYC'
import { 
  DollarSign, 
  CreditCard, 
  ArrowLeft,
  ArrowRight,
  Wallet,
  Banknote
} from 'lucide-react'

export default function WithdrawPage() {
  const router = useRouter()

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  }

  const withdrawalOptions = [
    {
      title: 'Withdraw PKR',
      description: 'Withdraw Pakistani Rupees to your bank account',
      icon: Banknote,
      path: '/user/withdraw/pkr',
      gradient: 'from-green-600 to-green-700',
      borderColor: 'border-green-200',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Withdraw USDT',
      description: 'Withdraw USDT to external TRON wallet (TRC-20)',
      icon: DollarSign,
      path: '/user/withdraw/usdt',
      gradient: 'from-blue-600 to-blue-700',
      borderColor: 'border-blue-200',
      bgColor: 'bg-blue-50'
    }
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
                onClick={() => router.push('/user/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Withdraw Funds
                </h1>
                <p className="text-gray-600 mt-1">Choose your preferred withdrawal method</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Introduction Card */}
          <motion.div {...fadeInUp} className="mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <Wallet className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Withdrawal Options</h2>
                    <p className="text-blue-100">Select the currency you want to withdraw</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-white/10 rounded-xl p-4">
                    <h3 className="font-semibold text-lg mb-2">Fast & Secure</h3>
                    <p className="text-blue-100 text-sm">
                      All withdrawals are processed securely with multi-factor authentication
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <h3 className="font-semibold text-lg mb-2">24/7 Support</h3>
                    <p className="text-blue-100 text-sm">
                      Our support team is available around the clock to assist you
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Withdrawal Options */}
          <div className="grid md:grid-cols-2 gap-6">
            {withdrawalOptions.map((option, index) => (
              <motion.div
                key={option.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group ${option.borderColor} ${option.bgColor}`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                      <div className={`bg-gradient-to-r ${option.gradient} p-4 rounded-xl text-white group-hover:scale-110 transition-transform`}>
                        <option.icon className="h-8 w-8" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-gray-900">{option.title}</CardTitle>
                        <CardDescription className="text-gray-600 mt-1">
                          {option.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Button 
                      className={`w-full bg-gradient-to-r ${option.gradient} hover:scale-105 transition-transform`}
                      onClick={() => router.push(option.path)}
                    >
                      <span className="flex items-center gap-2">
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Additional Information */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8"
          >
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Important Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">PKR Withdrawals</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Minimum withdrawal: 1,000 PKR</li>
                      <li>• Processing time: 1-2 business days</li>
                      <li>• Direct bank transfer</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">USDT Withdrawals</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Minimum withdrawal: 1 USDT</li>
                      <li>• Network: TRON (TRC-20)</li>
                      <li>• Processing time: 5-15 minutes</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Security Notice:</strong> All withdrawals require verification through your configured security methods. 
                    Make sure your account security is properly set up before initiating any withdrawal.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </RequireKYC>
  )
}
