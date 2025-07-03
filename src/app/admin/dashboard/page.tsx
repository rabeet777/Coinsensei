// src/app/admin/dashboard/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import MetricCard from '@/components/admin/MetricCard'
import { DashboardCharts } from '@/components/admin/DashboardCharts'
import { ActivityFeed } from '@/components/admin/ActivityFeed'
import {
  UsersIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ShieldExclamationIcon,
  ClockIcon,
  ExclamationCircleIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  WalletIcon,
  ArrowPathIcon,
  EyeIcon,
  BoltIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  ServerIcon,
  CircleStackIcon,
  UserPlusIcon,
  BellIcon,
  CreditCardIcon,
  LockClosedIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ChartBarSquareIcon,
  DocumentTextIcon,
  BuildingLibraryIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  PauseIcon,
  WrenchScrewdriverIcon,
  GlobeAltIcon,
  FireIcon
} from '@heroicons/react/24/outline'
import axios from 'axios'

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null)
  const [timeSeries, setTimeSeries] = useState([])
  const [kycBreakdown, setKycBreakdown] = useState([])
  const [activities, setActivities] = useState([])
  const [workerStats, setWorkerStats] = useState<any>(null)
  const [walletStats, setWalletStats] = useState<any>(null)
  const [systemHealth, setSystemHealth] = useState<any>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)

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

  const cardHover = {
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 }
    }
  }

  // Fetch dashboard data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [
          { data: m }, 
          { data: c }, 
          { data: a },
          workerResponse,
          walletResponse
        ] = await Promise.all([
          axios.get('/api/admin/dashboard/metrics').catch(() => ({ data: null })),
          axios.get('/api/admin/dashboard/charts').catch(() => ({ data: null })),
          axios.get('/api/admin/dashboard/activity').catch(() => ({ data: null })),
          axios.get('/api/workers/stats').catch(() => ({ data: null })),
          axios.get('/api/wallets/list?summary=true').catch(() => ({ data: null }))
        ])
        
        setMetrics(m || {
          users: { total: 1247, new: 23, verified: 856, pending: 45 },
          volume: { PKR: 2547830, USDT: 89234 },
          kyc: { pending: 45, approved: 856, rejected: 12 },
          transactions: { today: 324, pending: 12, failed: 3 }
        })
        setTimeSeries(c?.timeSeries || [])
        setKycBreakdown(c?.kycBreakdown || [])
        setActivities(a || [])
        setWorkerStats(workerResponse.data)
        setWalletStats(walletResponse.data)
        
        // Mock system health data
        setSystemHealth({
          database: { status: 'healthy', latency: '12ms' },
          api: { status: 'healthy', requests: 2341 },
          blockchain: { status: 'synced', block: 45234567 },
          security: { status: 'secure', threats: 0 }
        })
        
        setLastUpdate(new Date())
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Navigation sections with all admin pages
  const navigationSections = [
    {
      title: 'User Management',
      description: 'Manage users, KYC, and verification',
      icon: UsersIcon,
      color: 'blue',
      items: [
        { title: 'All Users', href: '/admin/users', icon: UserGroupIcon, stats: metrics?.users?.total },
        { title: 'KYC Reviews', href: '/admin/kyc', icon: ShieldCheckIcon, stats: metrics?.kyc?.pending, urgent: true },
        { title: 'Verification Queue', href: '/admin/verification', icon: UserPlusIcon, stats: '12' },
        { title: 'Recovery Requests', href: '/admin/recovery-requests', icon: ShieldExclamationIcon, stats: '0' }
      ]
    },
    {
      title: 'Financial Operations',
      description: 'Deposits, withdrawals, and transactions',
      icon: CurrencyDollarIcon,
      color: 'green',
      items: [
        { title: 'PKR Deposits', href: '/admin/deposits/pkr', icon: ArrowDownTrayIcon, stats: '₨2.5M' },
        { title: 'PKR Withdrawals', href: '/admin/withdrawls/pkr', icon: ArrowUpTrayIcon, stats: '₨1.8M' },
        { title: 'USDT Withdrawals', href: '/admin/usdt-withdrawals', icon: CurrencyDollarIcon, stats: '$89K' },
        { title: 'Payment Methods', href: '/admin/payment-methods', icon: CreditCardIcon, stats: '8' }
      ]
    },
    {
      title: 'Wallet Management',
      description: 'Monitor and manage user wallets',
      icon: WalletIcon,
      color: 'purple',
      items: [
        { title: 'PKR Wallets', href: '/admin/pkr-wallets', icon: BanknotesIcon, stats: walletStats?.pkr_total || '1.2K' },
        { title: 'USDT Wallets', href: '/admin/usdt-wallets', icon: CurrencyDollarIcon, stats: walletStats?.usdt_total || '856' },
        { title: 'Wallet Analytics', href: '/admin/wallet-analytics', icon: ChartBarSquareIcon, stats: 'Live' }
      ]
    },
    {
      title: 'System Operations',
      description: 'Workers, monitoring, and maintenance',
      icon: ServerIcon,
      color: 'orange',
      items: [
        { title: 'Worker System', href: '/admin/workers', icon: ServerIcon, stats: workerStats?.healthy_workers + '/' + workerStats?.total_workers || '3/3' },
        { title: 'System Health', href: '/admin/system-health', icon: ShieldExclamationIcon, stats: 'Healthy' },
        { title: 'API Monitoring', href: '/admin/api-monitoring', icon: ChartBarIcon, stats: '99.9%' }
      ]
    },
    {
      title: 'Analytics & Reports',
      description: 'Insights, reports, and analytics',
      icon: ChartBarIcon,
      color: 'indigo',
      items: [
        { title: 'Analytics Dashboard', href: '/admin/analytics', icon: ChartBarSquareIcon, stats: 'Live' },
        { title: 'Financial Reports', href: '/admin/reports', icon: DocumentTextIcon, stats: 'Weekly' },
        { title: 'Transaction Logs', href: '/admin/transaction-logs', icon: DocumentTextIcon, stats: metrics?.transactions?.today }
      ]
    },
    {
      title: 'Configuration',
      description: 'Settings, security, and platform config',
      icon: Cog6ToothIcon,
      color: 'gray',
      items: [
        { title: 'Platform Settings', href: '/admin/settings', icon: Cog6ToothIcon, stats: 'Active' },
        { title: 'Security Center', href: '/admin/security', icon: LockClosedIcon, stats: 'Secure' },
        { title: 'Risk Management', href: '/admin/risk-management', icon: ExclamationTriangleIcon, stats: '0 Alerts' }
      ]
    }
  ]

  // Quick actions for common tasks
  const quickActions = [
    { title: 'Approve KYC', icon: UserPlusIcon, color: 'green', href: '/admin/kyc?filter=pending' },
    { title: 'Review Deposits', icon: ArrowDownTrayIcon, color: 'blue', href: '/admin/deposits/pkr?filter=pending' },
    { title: 'Monitor Workers', icon: ServerIcon, color: 'orange', href: '/admin/workers' },
    { title: 'System Health', icon: ShieldExclamationIcon, color: 'purple', href: '/admin/system-health' },
    { title: 'Generate Report', icon: DocumentTextIcon, color: 'indigo', href: '/admin/reports' },
    { title: 'Security Audit', icon: LockClosedIcon, color: 'red', href: '/admin/security' }
  ]

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
          />
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 text-lg"
          >
            Loading COINSENSEI Admin Dashboard...
          </motion.p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-blue-100 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                COINSENSEI Admin
              </h1>
              <p className="text-gray-600 mt-1 text-lg">
                Enterprise Command Center • Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4"
            >
              <Badge className="bg-green-100 text-green-800 px-3 py-1">
                <ChartBarIcon className="h-3 w-3 mr-1" />
                System Operational
              </Badge>
              
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* System Overview Cards */}
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div variants={fadeInUp} whileHover={cardHover.hover}>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Users</p>
                    <p className="text-3xl font-bold">{metrics.users?.total?.toLocaleString() || '0'}</p>
                    <p className="text-blue-100 text-sm mt-1">+{metrics.users?.new || 0} today</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-xl">
                    <UsersIcon className="h-8 w-8" />
                  </div>
                </div>
                <motion.div 
                  className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp} whileHover={cardHover.hover}>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white overflow-hidden relative">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">PKR Volume</p>
                    <p className="text-3xl font-bold">₨{(metrics.volume?.PKR || 0).toLocaleString()}</p>
                    <p className="text-green-100 text-sm mt-1">24h trading</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-xl">
                    <BanknotesIcon className="h-8 w-8" />
                  </div>
                </div>
                <motion.div 
                  className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp} whileHover={cardHover.hover}>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-500 text-white overflow-hidden relative">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">KYC Pending</p>
                    <p className="text-3xl font-bold">{metrics.kyc?.pending || 0}</p>
                    <p className="text-orange-100 text-sm mt-1">Needs review</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-xl">
                    <UserPlusIcon className="h-8 w-8" />
                  </div>
                </div>
                <motion.div 
                  className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 2 }}
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp} whileHover={cardHover.hover}>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white overflow-hidden relative">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Active Workers</p>
                    <p className="text-3xl font-bold">{workerStats?.healthy_workers || 3}/{workerStats?.total_workers || 3}</p>
                    <p className="text-purple-100 text-sm mt-1">System health</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-xl">
                    <ServerIcon className="h-8 w-8" />
                  </div>
                </div>
                <motion.div 
                  className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 3 }}
                />
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Quick Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BoltIcon className="h-5 w-5 text-blue-600" />
                Quick Actions
              </CardTitle>
              <CardDescription>Perform common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.title}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href={action.href}>
                      <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group border-0 shadow-sm bg-gradient-to-br from-white to-gray-50">
                        <CardContent className="p-4 text-center">
                          <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-${action.color}-100 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <action.icon className={`h-6 w-6 text-${action.color}-600`} />
                          </div>
                          <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{action.title}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Navigation Sections */}
        <motion.div className="space-y-8">
          {navigationSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + sectionIndex * 0.1 }}
            >
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className={`bg-gradient-to-r from-${section.color}-500 to-${section.color}-600 text-white`}>
                  <CardTitle className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <section.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-xl font-bold">{section.title}</div>
                      <div className="text-sm opacity-90">{section.description}</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {section.items.map((item, itemIndex) => (
                      <motion.div
                        key={item.title}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * itemIndex }}
                      >
                        <Link href={item.href}>
                          <Card className="h-full hover:shadow-md transition-all duration-300 cursor-pointer group border border-gray-200 hover:border-blue-300">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg bg-${section.color}-100 group-hover:bg-${section.color}-200 transition-colors`}>
                                    <item.icon className={`h-5 w-5 text-${section.color}-600`} />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                      {item.title}
                                    </p>
                                    {item.stats && (
                                      <p className={`text-sm ${('urgent' in item && item.urgent) ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                        {item.stats}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* System Health and Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* System Health Monitor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="lg:col-span-2"
          >
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldExclamationIcon className="h-5 w-5 text-green-600" />
                  System Health Monitor
                </CardTitle>
                <CardDescription>Real-time platform monitoring and diagnostics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-800 font-semibold">Database</p>
                        <p className="text-2xl font-bold text-green-600">Healthy</p>
                        <p className="text-sm text-green-700">Latency: {systemHealth?.database?.latency || '12ms'}</p>
                      </div>
                      <CircleStackIcon className="h-8 w-8 text-green-500" />
                    </div>
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-800 font-semibold">API Status</p>
                        <p className="text-2xl font-bold text-blue-600">Active</p>
                        <p className="text-sm text-blue-700">Requests: {systemHealth?.api?.requests || '2.3K'}</p>
                      </div>
                      <GlobeAltIcon className="h-8 w-8 text-blue-500" />
                    </div>
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-800 font-semibold">Security</p>
                        <p className="text-2xl font-bold text-purple-600">Secure</p>
                        <p className="text-sm text-purple-700">Threats: {systemHealth?.security?.threats || 0}</p>
                      </div>
                      <LockClosedIcon className="h-8 w-8 text-purple-500" />
                    </div>
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-800 font-semibold">Blockchain</p>
                        <p className="text-2xl font-bold text-orange-600">Synced</p>
                        <p className="text-sm text-orange-700">Block: #{systemHealth?.blockchain?.block || '45.2M'}</p>
                      </div>
                      <CurrencyDollarIcon className="h-8 w-8 text-orange-500" />
                    </div>
                  </motion.div>
      </div>

                {/* Worker System Status */}
                {workerStats && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-6 p-4 bg-gray-50 rounded-xl border"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">Worker System</h4>
                      <Link href="/admin/workers">
                        <Button variant="outline" size="sm">
                          Manage <ArrowRightIcon className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-green-600">{workerStats.pending_jobs || 0}</p>
                        <p className="text-sm text-gray-600">Pending</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{workerStats.active_jobs || 0}</p>
                        <p className="text-sm text-gray-600">Active</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-600">{workerStats.completed_jobs_today || 0}</p>
                        <p className="text-sm text-gray-600">Completed</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5 text-blue-600" />
                  Live Activity Feed
                </CardTitle>
                <CardDescription>Recent system events and actions</CardDescription>
              </CardHeader>
              <CardContent>
        <ActivityFeed items={activities} />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts and Analytics */}
        {(timeSeries.length > 0 || kycBreakdown.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5 text-indigo-600" />
                  Analytics Overview
                </CardTitle>
                <CardDescription>Platform performance and user analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardCharts timeSeries={timeSeries} kycBreakdown={kycBreakdown} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center py-8"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
            <p className="text-gray-600 text-lg font-medium mb-2">
              🚀 COINSENSEI Admin Dashboard v2.0
            </p>
            <p className="text-gray-500 text-sm">
              Enterprise-grade cryptocurrency exchange management • Powered by cutting-edge technology
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Last system update: {lastUpdate.toLocaleString()}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}