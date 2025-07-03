'use client';

import React, { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ServerIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  PlayIcon,
  PauseIcon,
  CogIcon,
  ChartBarIcon,
  WalletIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  TrashIcon,
  BuildingLibraryIcon,
  BanknotesIcon,
  FireIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline'
import { Dialog, Transition } from '@headlessui/react'

interface Worker {
  id: string
  name: string
  status: 'active' | 'idle' | 'paused' | 'error'
  active_jobs: number
  completed_jobs: number
  failed_jobs: number
  queued_jobs: number
  completed_today: number
  last_active: string
  error_message?: string
}

interface Job {
  id: string
  job_id: string
  job_type: 'sync' | 'consolidation' | 'gas-topup'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  wallet_address: string
  user_id: string
  data: any
  retry_count: number
  max_retries: number
  error_message?: string
  created_at: string
  updated_at: string
  processed_at?: string
}

interface Wallet {
  id: string
  address: string
  user_id: string
  balance: number
  needs_consolidation: boolean
  needs_gas: boolean
  is_processing: boolean
  user_profile?: {
    full_name: string
  }
}

interface SystemStats {
  total_workers: number
  active_workers: number
  total_jobs_today: number
  pending_jobs: number
  active_jobs: number
  failed_jobs: number
  system_status: 'healthy' | 'degraded' | 'down'
  uptime: number
}

export default function AdminWorkersPage() {
  const supabase = createClientComponentClient()
  
  const [workers, setWorkers] = useState<Worker[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [jobModalOpen, setJobModalOpen] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)
  const [jobType, setJobType] = useState<'consolidation' | 'gas-topup'>('consolidation')
  const [walletSearchQuery, setWalletSearchQuery] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Filter states
  const [jobFilter, setJobFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all')
  const [workerFilter, setWorkerFilter] = useState<'all' | 'active' | 'idle' | 'error'>('all')

  // Load data
  async function loadData() {
    setLoading(true)
    setError(null)
    
    try {
      // Load workers (simulated)
      const mockWorkers: Worker[] = [
        {
          id: '1',
          name: 'Wallet Sync Worker',
          status: 'active',
          active_jobs: 3,
          completed_jobs: 1247,
          failed_jobs: 12,
          queued_jobs: 8,
          completed_today: 156,
          last_active: new Date().toISOString()
        },
        {
          id: '2', 
          name: 'Consolidation Worker',
          status: 'active',
          active_jobs: 1,
          completed_jobs: 89,
          failed_jobs: 2,
          queued_jobs: 4,
          completed_today: 23,
          last_active: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Gas Topup Worker', 
          status: 'idle',
          active_jobs: 0,
          completed_jobs: 445,
          failed_jobs: 7,
          queued_jobs: 0,
          completed_today: 31,
          last_active: new Date(Date.now() - 300000).toISOString()
        }
      ]
      setWorkers(mockWorkers)

      // Load jobs from database
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (jobsError) throw jobsError
      setJobs(jobsData || [])

      // Load wallets
      const { data: walletsData, error: walletsError } = await supabase
        .from('user_wallets')
        .select(`
          id,
          address,
          user_id,
          balance,
          needs_consolidation,
          needs_gas,
          is_processing
        `)
        .limit(100)

      if (walletsError) throw walletsError

      // Load user profiles separately
      const userIds = walletsData?.map(w => w.user_id) || []
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profile')
        .select('uid, full_name')
        .in('uid', userIds)

      if (profilesError) throw profilesError

      // Create profile map
      const profileMap = new Map()
      profilesData?.forEach(profile => {
        profileMap.set(profile.uid, { full_name: profile.full_name })
      })

      // Combine data
      const combinedWallets = walletsData?.map(wallet => ({
        ...wallet,
        user_profile: profileMap.get(wallet.user_id) || { full_name: 'Unknown User' }
      })) || []

      setWallets(combinedWallets)

      // Calculate stats
      const totalJobs = jobsData?.length || 0
      const todayJobs = jobsData?.filter(job => 
        new Date(job.created_at).toDateString() === new Date().toDateString()
      ).length || 0
      
      const pendingJobs = jobsData?.filter(job => job.status === 'pending').length || 0
      const activeJobs = jobsData?.filter(job => job.status === 'processing').length || 0
      const failedJobs = jobsData?.filter(job => job.status === 'failed').length || 0

      setStats({
        total_workers: mockWorkers.length,
        active_workers: mockWorkers.filter(w => w.status === 'active').length,
        total_jobs_today: todayJobs,
        pending_jobs: pendingJobs,
        active_jobs: activeJobs,
        failed_jobs: failedJobs,
        system_status: failedJobs > pendingJobs ? 'degraded' : 'healthy',
        uptime: 99.7
      })

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Start/Pause workers
  async function toggleWorkers(action: 'start' | 'pause') {
    setActionLoading(action)
    
    try {
      const response = await fetch('/api/admin/workers/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} workers`)
      }

      // Update worker statuses
      setWorkers(prev => prev.map(worker => ({
        ...worker,
        status: action === 'start' ? 'active' : 'paused'
      })))

    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // Dispatch job to specific wallet
  async function dispatchJob(wallet: Wallet, type: 'consolidation' | 'gas-topup') {
    setActionLoading(`job_${wallet.id}`)
    
    try {
      const response = await fetch('/api/admin/dispatch-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId: wallet.id,
          userId: wallet.user_id,
          address: wallet.address,
          jobType: type
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to dispatch ${type} job`)
      }

      await loadData()
      setJobModalOpen(false)
      setSelectedWallet(null)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // Clear failed jobs
  async function clearFailedJobs() {
    setActionLoading('clear_failed')
    
    try {
      const response = await fetch('/api/admin/jobs/clear-failed', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to clear failed jobs')
      }

      await loadData()

    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // Reset processing states
  async function resetProcessingStates() {
    setActionLoading('reset_processing')
    
    try {
      const response = await fetch('/api/admin/reset-processing', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to reset processing states')
      }

      await loadData()

    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // Filter functions
  const filteredJobs = jobs.filter(job => {
    if (jobFilter === 'all') return true
    return job.status === jobFilter
  })

  const filteredWorkers = workers.filter(worker => {
    if (workerFilter === 'all') return true
    return worker.status === workerFilter
  })

  const filteredWallets = wallets.filter(wallet => {
    if (!walletSearchQuery) return true
    return wallet.address.toLowerCase().includes(walletSearchQuery.toLowerCase()) ||
           wallet.user_profile?.full_name?.toLowerCase().includes(walletSearchQuery.toLowerCase())
  })

  useEffect(() => {
    loadData()
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(loadData, 15000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'processing': case 'completed':
        return 'bg-green-100 text-green-800'
      case 'idle': case 'pending':
        return 'bg-blue-100 text-blue-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'error': case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': case 'processing':
        return <BoltIcon className="h-3 w-3" />
      case 'completed':
        return <CheckCircleIcon className="h-3 w-3" />
      case 'idle': case 'pending':
        return <ClockIcon className="h-3 w-3" />
      case 'paused':
        return <PauseIcon className="h-3 w-3" />
      case 'error': case 'failed':
        return <XCircleIcon className="h-3 w-3" />
      default:
        return <ClockIcon className="h-3 w-3" />
    }
  }

  if (loading && workers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading worker system...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
        <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <ServerIcon className="h-8 w-8 text-blue-600" />
                Worker Management System
              </h1>
          <p className="text-gray-600 mt-1">
                Enterprise-grade job queue and worker monitoring
          </p>
        </div>
        
            <div className="flex items-center gap-3">
              <Badge className={`${stats?.system_status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                <ServerIcon className="h-3 w-3 mr-1" />
                {stats?.system_status === 'healthy' ? 'System Healthy' : 'System Degraded'}
              </Badge>
              
              <button
                onClick={loadData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowPathIcon className="h-4 w-4" />
                )}
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* System Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Active Workers</p>
                    <p className="text-3xl font-bold">{stats?.active_workers}/{stats?.total_workers}</p>
                  </div>
                  <ServerIcon className="h-8 w-8 text-blue-200" />
                </div>
                <div className="mt-4 text-sm text-blue-100">
                  Uptime: {stats?.uptime}%
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-r from-green-600 to-green-700 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Jobs Today</p>
                    <p className="text-3xl font-bold">{stats?.total_jobs_today}</p>
                  </div>
                  <ChartBarIcon className="h-8 w-8 text-green-200" />
                </div>
                <div className="mt-4 text-sm text-green-100">
                  Processing: {stats?.active_jobs}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-r from-yellow-600 to-yellow-700 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm">Pending Jobs</p>
                    <p className="text-3xl font-bold">{stats?.pending_jobs}</p>
                  </div>
                  <ClockIcon className="h-8 w-8 text-yellow-200" />
                </div>
                <div className="mt-4 text-sm text-yellow-100">
                  In queue waiting
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-r from-red-600 to-red-700 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Failed Jobs</p>
                    <p className="text-3xl font-bold">{stats?.failed_jobs}</p>
                  </div>
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-200" />
                </div>
                <div className="mt-4 text-sm text-red-100">
                  Need attention
                </div>
              </CardContent>
      </Card>
          </motion.div>
        </div>

        {/* System Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CogIcon className="h-5 w-5" />
            System Controls
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <button
              onClick={() => toggleWorkers('start')}
              disabled={actionLoading === 'start'}
              className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {actionLoading === 'start' ? (
                <div className="w-5 h-5 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin" />
              ) : (
                <PlayIcon className="h-5 w-5 text-green-600" />
              )}
              <span className="text-green-700 font-medium">Start Workers</span>
            </button>

            <button
              onClick={() => toggleWorkers('pause')}
              disabled={actionLoading === 'pause'}
              className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {actionLoading === 'pause' ? (
                <div className="w-5 h-5 border-2 border-yellow-600/30 border-t-yellow-600 rounded-full animate-spin" />
              ) : (
                <PauseIcon className="h-5 w-5 text-yellow-600" />
              )}
              <span className="text-yellow-700 font-medium">Pause System</span>
            </button>

            <button
              onClick={() => setJobModalOpen(true)}
              className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="h-5 w-5 text-blue-600" />
              <span className="text-blue-700 font-medium">Queue Job</span>
            </button>

            <button
              onClick={clearFailedJobs}
              disabled={actionLoading === 'clear_failed'}
              className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {actionLoading === 'clear_failed' ? (
                <div className="w-5 h-5 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
              ) : (
                <TrashIcon className="h-5 w-5 text-red-600" />
              )}
              <span className="text-red-700 font-medium">Clear Failed</span>
            </button>

            <button
              onClick={resetProcessingStates}
              disabled={actionLoading === 'reset_processing'}
              className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {actionLoading === 'reset_processing' ? (
                <div className="w-5 h-5 border-2 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
              ) : (
                <ArrowPathIcon className="h-5 w-5 text-purple-600" />
              )}
              <span className="text-purple-700 font-medium">Reset States</span>
            </button>
          </div>
        </motion.div>

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
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <span className="font-medium">{error}</span>
            </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Workers Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8"
        >
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Worker Status ({filteredWorkers.length})
            </h2>
            <select
              value={workerFilter}
              onChange={(e) => setWorkerFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Workers</option>
              <option value="active">Active</option>
              <option value="idle">Idle</option>
              <option value="error">Error</option>
            </select>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkers.map((worker, index) => (
                <motion.div
                  key={worker.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{worker.name}</h3>
                    <Badge className={getStatusColor(worker.status)}>
                      {getStatusIcon(worker.status)}
                      <span className="ml-1 capitalize">{worker.status}</span>
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">{worker.active_jobs}</p>
                      <p className="text-xs text-gray-600">Active</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">{worker.completed_today}</p>
                      <p className="text-xs text-gray-600">Today</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-yellow-600">{worker.queued_jobs}</p>
                      <p className="text-xs text-gray-600">Queued</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-red-600">{worker.failed_jobs}</p>
                      <p className="text-xs text-gray-600">Failed</p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-3">
                    Last active: {new Date(worker.last_active).toLocaleString()}
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium flex items-center justify-center gap-1">
                      <EyeIcon className="h-3 w-3" />
                      View Logs
                    </button>
                    <button className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <CogIcon className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Jobs Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Jobs ({filteredJobs.length})
            </h2>
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Jobs</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <ServerIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl font-medium text-gray-600 mb-2">No jobs found</p>
              <p className="text-gray-500">Jobs will appear here once workers start processing</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wallet</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {filteredJobs.slice(0, 20).map((job, index) => (
                      <motion.tr
                        key={job.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-blue-100 p-2 rounded-full mr-3">
                              {job.job_type === 'consolidation' ? (
                                <ArrowsRightLeftIcon className="h-4 w-4 text-blue-600" />
                              ) : job.job_type === 'gas-topup' ? (
                                <FireIcon className="h-4 w-4 text-blue-600" />
                              ) : (
                                <BoltIcon className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900 capitalize">
                                {job.job_type.replace('-', ' ')}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {job.job_id}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">
                            {job.wallet_address?.slice(0, 8)}...{job.wallet_address?.slice(-6)}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor(job.status)}>
                            {getStatusIcon(job.status)}
                            <span className="ml-1 capitalize">{job.status}</span>
                          </Badge>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {job.retry_count}/{job.max_retries} attempts
                          </div>
                          {job.error_message && (
                            <div className="text-xs text-red-600 truncate max-w-40">
                              {job.error_message}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(job.created_at).toLocaleDateString()}
                          <div className="text-xs">
                            {new Date(job.created_at).toLocaleTimeString()}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium flex items-center gap-1">
                            <EyeIcon className="h-3 w-3" />
                            View
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Job Dispatch Modal */}
      <Transition appear show={jobModalOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setJobModalOpen(false)}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    Queue Job to Wallet
                  </Dialog.Title>

                  <div className="space-y-6">
                    {/* Job Type Selection */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Select Job Type</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setJobType('consolidation')}
                          className={`p-4 border rounded-lg transition-colors ${
                            jobType === 'consolidation'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <ArrowsRightLeftIcon className="h-8 w-8 mx-auto mb-2" />
                          <p className="font-medium">Consolidation</p>
                          <p className="text-sm text-gray-600">Consolidate wallet funds</p>
                        </button>
                        
                        <button
                          onClick={() => setJobType('gas-topup')}
                          className={`p-4 border rounded-lg transition-colors ${
                            jobType === 'gas-topup'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <FireIcon className="h-8 w-8 mx-auto mb-2" />
                          <p className="font-medium">Gas Topup</p>
                          <p className="text-sm text-gray-600">Add TRX for gas fees</p>
                        </button>
                      </div>
                    </div>

                    {/* Wallet Search and Selection */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Select Wallet</h4>
                      <div className="relative mb-4">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search by address or user name..."
                          value={walletSearchQuery}
                          onChange={(e) => setWalletSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                        {filteredWallets.slice(0, 20).map((wallet) => (
                          <button
                            key={wallet.id}
                            onClick={() => setSelectedWallet(wallet)}
                            className={`w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                              selectedWallet?.id === wallet.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{wallet.user_profile?.full_name || 'Unknown User'}</p>
                                <p className="text-sm font-mono text-gray-600">
                                  {wallet.address.slice(0, 12)}...{wallet.address.slice(-8)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">${Number(wallet.balance).toLocaleString()}</p>
                                <div className="flex gap-1">
                                  {wallet.needs_consolidation && (
                                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">Needs Consolidation</Badge>
                                  )}
                                  {wallet.needs_gas && (
                                    <Badge className="bg-red-100 text-red-800 text-xs">Needs Gas</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Selected Wallet Summary */}
                    {selectedWallet && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">Selected Wallet</h4>
                        <div className="text-sm text-blue-800">
                          <p><strong>User:</strong> {selectedWallet.user_profile?.full_name}</p>
                          <p><strong>Address:</strong> {selectedWallet.address}</p>
                          <p><strong>Balance:</strong> ${Number(selectedWallet.balance).toLocaleString()}</p>
                          <p><strong>Job Type:</strong> {jobType.replace('-', ' ')}</p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setJobModalOpen(false)
                          setSelectedWallet(null)
                          setWalletSearchQuery('')
                        }}
                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      
                      <button
                        onClick={() => selectedWallet && dispatchJob(selectedWallet, jobType)}
                        disabled={!selectedWallet || actionLoading === `job_${selectedWallet?.id}`}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {actionLoading === `job_${selectedWallet?.id}` ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <PlusIcon className="h-4 w-4" />
                        )}
                        Queue Job
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
} 