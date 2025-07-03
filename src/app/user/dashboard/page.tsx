// src/app/user/dashboard/page.tsx
'use client'

import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Wallet, 
  TrendingUp, 
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  History,
  Clock,
  ChevronRight,
  ArrowRightLeft,
  Banknote,
  CreditCard,
  Sparkles,
  Star,
  Send,
  UserCheck,
  Settings,
  Zap,
  Gift,
  Bell,
  PiggyBank,
  Coins
} from 'lucide-react'

export default function UserDashboard() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()

  // Local state
  const [pkrTotal, setPkrTotal] = useState<number | null>(null)
  const [usdtTotal, setUsdtTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [balanceVisible, setBalanceVisible] = useState<boolean>(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (session === null) {
      router.replace(`/auth/login?redirectTo=${encodeURIComponent('/user/dashboard')}`)
    }
  }, [session, router])

  // Fetch wallet totals
  useEffect(() => {
    if (!session?.user.id) return

    async function fetchTotals() {
      setLoading(true)
      const userId = (session as NonNullable<typeof session>).user.id

      // PKR wallet
      const { data: pkrRow, error: pkrErr } = await supabase
        .from('user_pkr_wallets')
        .select('total_balance')
        .eq('user_id', userId)
        .single()

      if (!pkrErr && pkrRow) {
        setPkrTotal(Number(pkrRow.total_balance))
      } else {
        setPkrTotal(0) 
      }

      // USDT wallet
      const { data: usdtRow, error: usdtErr } = await supabase
        .from('user_wallets')
        .select('total_balance')
        .eq('user_id', userId)
        .single()

      if (!usdtErr && usdtRow) {
        setUsdtTotal(Number(usdtRow.total_balance))
      } else {
        setUsdtTotal(0)
      }

      setLastUpdate(new Date())
      setLoading(false)
    }

    fetchTotals()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchTotals, 30000)
    return () => clearInterval(interval)
  }, [session, supabase])

  if (session === undefined || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/40">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full"
        />
        <span className="ml-4 text-gray-600 font-medium text-lg">Loading your dashboard...</span>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const totalValueUSD = (usdtTotal || 0) + ((pkrTotal || 0) / 280)
  const totalValuePKR = (pkrTotal || 0) + ((usdtTotal || 0) * 280)

  const formatBalance = (amount: number, currency: string) => {
    if (!balanceVisible) return '••••••'
    if (currency === 'PKR') return `₨${amount.toLocaleString()}`
    return `${amount.toFixed(2)} USDT`
  }

  const quickActions = [
    {
      title: 'Transfer PKR',
      description: 'Send money to other users',
      icon: Send,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100/50',
      action: () => router.push('/user/transfer/pkr')
    },
    {
      title: 'Trade',
      description: 'Exchange PKR ↔ USDT',
      icon: ArrowRightLeft,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'from-emerald-50 to-emerald-100/50',
      action: () => router.push('/user/trade')
    },
    {
      title: 'KYC Verify',
      description: 'Complete verification',
      icon: UserCheck,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100/50',
      action: () => router.push('/user/kyc')
    },
    {
      title: 'Settings',
      description: 'Account & security',
      icon: Settings,
      color: 'from-gray-500 to-gray-600',
      bgColor: 'from-gray-50 to-gray-100/50',
      action: () => router.push('/user/settings')
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/30 relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-blue-100/15 to-indigo-100/15 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            x: [0, -80, 0],
            y: [0, 100, 0],
            rotate: [360, 180, 0]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 right-20 w-40 h-40 bg-gradient-to-r from-purple-100/10 to-blue-100/10 rounded-full blur-3xl"
        />
      </div>

      {/* Header */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-gray-200/40 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold text-gray-800 flex items-center gap-3"
              >
                <div className="p-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                Dashboard
              </motion.h1>
              <p className="text-gray-500 text-sm mt-2 font-medium">
                Welcome back, <span className="text-gray-700 font-semibold">{session.user.email?.split('@')[0]}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 rounded-xl transition-all duration-200"
              >
                {balanceVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.location.reload()} 
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 rounded-xl transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Badge className="bg-green-50 text-green-700 border-green-200/60 shadow-sm px-3 py-1.5 rounded-full">
                <Shield className="h-3 w-3 mr-1.5" />
                Secure
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 relative z-10">
        {/* Portfolio Overview */}
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={fadeInUp}>
            <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/40 via-indigo-50/30 to-purple-50/40"></div>
              
              <CardContent className="relative p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-5">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg"
                    >
                      <Wallet className="h-8 w-8 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-800 mb-1">Total Portfolio</h2>
                      <p className="text-gray-500 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Updated {lastUpdate.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <span className="text-gray-600 font-medium">Premium</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40 shadow-md"
                  >
                    <p className="text-4xl font-bold text-gray-800 mb-2">
                      {formatBalance(totalValuePKR, 'PKR')}
                    </p>
                    <p className="text-gray-500 font-medium">Pakistani Rupee</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40 shadow-md"
                  >
                    <p className="text-4xl font-bold text-gray-800 mb-2">
                      {formatBalance(totalValueUSD, 'USDT')}
                    </p>
                    <p className="text-gray-500 font-medium">US Dollar Tether</p>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Wallet Cards */}
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="grid md:grid-cols-2 gap-6"
        >
          {/* PKR Wallet */}
          <motion.div variants={fadeInUp}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-500 bg-white/70 backdrop-blur-sm group overflow-hidden border-l-4 border-l-blue-500">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 to-cyan-50/30"></div>
              <CardHeader className="pb-4 relative">
                <div className="flex items-center gap-4">
                    <motion.div 
                    whileHover={{ rotate: 5, scale: 1.05 }}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-2xl shadow-lg"
                    >
                    <Banknote className="h-6 w-6 text-white" />
                    </motion.div>
                    <div>
                    <CardTitle className="text-lg text-gray-800">PKR Wallet</CardTitle>
                    <CardDescription className="text-gray-500 text-sm">Pakistani Rupee</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 relative">
                <div className="bg-white/40 backdrop-blur-sm p-4 rounded-xl border border-white/30">
                  <p className="text-2xl font-bold text-gray-800 mb-1">
                    {formatBalance(pkrTotal || 0, 'PKR')}
                  </p>
                  <p className="text-gray-500 text-sm">Available Balance</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md transition-all duration-300 rounded-lg"
                    onClick={() => router.push('/user/deposits/pkr')}
                  >
                    <ArrowDownLeft className="h-3 w-3 mr-1" />
                    Deposit
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 rounded-lg"
                    onClick={() => router.push('/user/withdraw/pkr')}
                  >
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    Withdraw
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* USDT Wallet */}
          <motion.div variants={fadeInUp}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-500 bg-white/70 backdrop-blur-sm group overflow-hidden border-l-4 border-l-purple-500">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 to-indigo-50/30"></div>
              <CardHeader className="pb-4 relative">
                <div className="flex items-center gap-4">
                    <motion.div 
                    whileHover={{ rotate: -5, scale: 1.05 }}
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 p-3 rounded-2xl shadow-lg"
                    >
                    <Coins className="h-6 w-6 text-white" />
                    </motion.div>
                    <div>
                    <CardTitle className="text-lg text-gray-800">USDT Wallet</CardTitle>
                    <CardDescription className="text-gray-500 text-sm">Tether USD (TRC20)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 relative">
                <div className="bg-white/40 backdrop-blur-sm p-4 rounded-xl border border-white/30">
                  <p className="text-2xl font-bold text-gray-800 mb-1">
                    {formatBalance(usdtTotal || 0, 'USDT')}
                  </p>
                  <p className="text-gray-500 text-sm">Available Balance</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    size="sm"
                    className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm hover:shadow-md transition-all duration-300 rounded-lg"
                    onClick={() => router.push('/user/usdt-deposit')}
                  >
                    <ArrowDownLeft className="h-3 w-3 mr-1" />
                    Deposit
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 rounded-lg"
                    onClick={() => router.push('/user/withdraw/usdt')}
                  >
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    Withdraw
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={fadeInUp} className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white/60 backdrop-blur-sm cursor-pointer group overflow-hidden"
                    onClick={action.action}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.bgColor} opacity-50`}></div>
                    <CardContent className="p-6 relative">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className={`p-3 bg-gradient-to-r ${action.color} rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                          <action.icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 text-sm">{action.title}</h3>
                          <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Market Overview */}
        <motion.div variants={fadeInUp} initial="initial" animate="animate">
          <Card className="border-0 shadow-md bg-white/60 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/30 to-teal-50/20"></div>
            <CardHeader className="pb-4 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/70 backdrop-blur-sm p-3 rounded-2xl shadow-sm border border-emerald-100/60">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-800">Market Overview</CardTitle>
                    <CardDescription className="text-gray-500">Live exchange rates</CardDescription>
                  </div>
                </div>
                <div className="text-center bg-white/50 backdrop-blur-sm p-3 rounded-xl border border-white/30">
                  <p className="text-xl font-bold text-emerald-600">₨280.50</p>
                  <p className="text-xs text-gray-500">PKR/USDT</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-emerald-500 text-xs font-semibold">+0.8%</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <Button 
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-300 py-4 text-base font-semibold rounded-xl"
                onClick={() => router.push('/user/trade')}
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Start Trading
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={fadeInUp} initial="initial" animate="animate">
          <Card className="border-0 shadow-md bg-white/60 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-50/30 to-slate-50/20"></div>
            <CardHeader className="pb-4 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/70 backdrop-blur-sm p-3 rounded-2xl shadow-sm border border-gray-100/60">
                    <History className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-800">Recent Activity</CardTitle>
                    <CardDescription className="text-gray-500">Your latest transactions</CardDescription>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/user/transactions')}
                  className="text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all duration-300 rounded-lg"
                >
                  View All
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-center py-10 text-gray-500">
                <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl w-16 h-16 mx-auto mb-3 flex items-center justify-center border border-white/30">
                  <History className="h-8 w-8 text-gray-400" />
                </div>
                <p className="font-semibold text-gray-700 mb-1">No recent activity</p>
                <p className="text-sm text-gray-500">Your transactions will appear here</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
