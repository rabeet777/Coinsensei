'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import {
  ShieldExclamationIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  CameraIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  PhoneIcon,
  IdentificationIcon,
  EnvelopeIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  FunnelIcon,
  ChartBarIcon,
  ExclamationCircleIcon,
  HandThumbUpIcon,
  HandThumbDownIcon
} from '@heroicons/react/24/outline'

type RecoveryRequest = {
  id: string
  user_id: string
  request_type: 'lost_device' | 'lost_access' | 'account_compromise'
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  user_message: string
  admin_notes: string | null
  identity_verification: {
    live_photo: string
    user_agent: string
    timestamp: string
    user_profile: {
      first_name: string
      last_name: string
      email: string
      phone: string
    }
    ip_address: string
  }
  created_at: string
  updated_at: string
  approved_by: string | null
  approved_at: string | null
}

const requestTypeConfig = {
  lost_device: {
    label: 'Lost Device',
    color: 'orange',
    classes: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: PhoneIcon
  },
  lost_access: {
    label: 'Lost Access',
    color: 'blue',
    classes: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: UserIcon
  },
  account_compromise: {
    label: 'Account Compromise',
    color: 'red',
    classes: 'bg-red-100 text-red-800 border-red-200',
    icon: ExclamationTriangleIcon
  }
}

const statusConfig = {
  pending: {
    label: 'Pending Review',
    classes: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: ClockIcon
  },
  approved: {
    label: 'Approved',
    classes: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircleIcon
  },
  rejected: {
    label: 'Rejected',
    classes: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircleIcon
  },
  completed: {
    label: 'Completed',
    classes: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircleIcon
  }
}

export default function AdminRecoveryRequestsPage() {
  const supabase = createClientComponentClient<Database>()
  
  const [requests, setRequests] = useState<RecoveryRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'lost_device' | 'lost_access' | 'account_compromise'>('all')
  const [selectedRequest, setSelectedRequest] = useState<RecoveryRequest | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState('')

  // Load recovery requests
  async function loadRequests() {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('user_recovery_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  // Filter requests
  const filteredRequests = requests.filter(request => {
    const matchesSearch = !searchQuery || 
      request.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.user_message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.identity_verification?.user_profile?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.identity_verification?.user_profile?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.identity_verification?.user_profile?.email?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    const matchesType = typeFilter === 'all' || request.request_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // Calculate statistics
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    thisWeek: requests.filter(r => {
      const created = new Date(r.created_at)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return created >= weekAgo
    }).length
  }

  // Handle request approval/rejection
  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    setActionLoading(requestId)
    try {
      const response = await fetch('/api/admin/recovery/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          action,
          adminNotes
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process request')
      }

      // Refresh the requests list
      await loadRequests()
      setShowDetails(false)
      setSelectedRequest(null)
      setAdminNotes('')
      
      // You could add a toast notification here if you have a toast system
      console.log('Request processed successfully:', data.message)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const openRequestDetails = (request: RecoveryRequest) => {
    setSelectedRequest(request)
    setShowDetails(true)
    setAdminNotes(request.admin_notes || '')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-blue-700 bg-clip-text text-transparent">
                Recovery Requests
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Review and manage user account recovery requests
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ShieldExclamationIcon className="h-12 w-12 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-xl">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-xl">
                <XCircleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-3xl font-bold text-purple-600">{stats.thisWeek}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <CalendarIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                <span className="text-red-800 font-medium">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user ID, email, name, or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[150px]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[150px]"
            >
              <option value="all">All Types</option>
              <option value="lost_device">Lost Device</option>
              <option value="lost_access">Lost Access</option>
              <option value="account_compromise">Account Compromise</option>
            </select>

            <button
              onClick={loadRequests}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowPathIcon className="h-5 w-5" />
              )}
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Requests List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Recovery Requests ({filteredRequests.length})
            </h2>
            <p className="text-gray-600 mt-1">
              Review and approve user account recovery requests
            </p>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading recovery requests...</p>
                </div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <ShieldExclamationIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl font-medium text-gray-600 mb-2">
                  No recovery requests found
                </p>
                <p className="text-gray-500">
                  {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' 
                    ? 'Try adjusting your search criteria' 
                    : 'No recovery requests have been submitted yet'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                <AnimatePresence>
                  {filteredRequests.map((request, index) => {
                    const requestType = requestTypeConfig[request.request_type]
                    const status = statusConfig[request.status]
                    const RequestTypeIcon = requestType.icon
                    const StatusIcon = status.icon
                    
                    return (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                              <RequestTypeIcon className="h-6 w-6 text-white" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${requestType.classes}`}>
                                  <RequestTypeIcon className="h-3 w-3" />
                                  {requestType.label}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${status.classes}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {status.label}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600 mb-2">
                                <div className="flex items-center gap-2">
                                  <UserIcon className="h-4 w-4" />
                                  <span>{request.identity_verification?.user_profile?.first_name} {request.identity_verification?.user_profile?.last_name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <EnvelopeIcon className="h-4 w-4" />
                                  <span>{request.identity_verification?.user_profile?.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="h-4 w-4" />
                                  <span>Submitted {new Date(request.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-700 line-clamp-2">
                                {request.user_message}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => openRequestDetails(request)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors group-hover:scale-105 transform duration-200"
                            >
                              <EyeIcon className="h-4 w-4" />
                              Review
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Request Details Modal */}
      <AnimatePresence>
        {showDetails && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Recovery Request Details</h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircleIcon className="h-6 w-6 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Request Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Request Information</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Request Type</label>
                        <div className="mt-1">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${requestTypeConfig[selectedRequest.request_type].classes}`}>
                            {React.createElement(requestTypeConfig[selectedRequest.request_type].icon, { className: "h-4 w-4" })}
                            {requestTypeConfig[selectedRequest.request_type].label}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">Current Status</label>
                        <div className="mt-1">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${statusConfig[selectedRequest.status].classes}`}>
                            {React.createElement(statusConfig[selectedRequest.status].icon, { className: "h-4 w-4" })}
                            {statusConfig[selectedRequest.status].label}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">Submitted</label>
                        <div className="mt-1 flex items-center gap-2 text-gray-700">
                          <CalendarIcon className="h-4 w-4" />
                          {new Date(selectedRequest.created_at).toLocaleString()}
                        </div>
                      </div>

                      {selectedRequest.approved_at && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Reviewed</label>
                          <div className="mt-1 flex items-center gap-2 text-gray-700">
                            <CalendarIcon className="h-4 w-4" />
                            {new Date(selectedRequest.approved_at).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">User Information</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Full Name</label>
                        <div className="mt-1 flex items-center gap-2 text-gray-700">
                          <UserIcon className="h-4 w-4" />
                          {selectedRequest.identity_verification?.user_profile?.first_name} {selectedRequest.identity_verification?.user_profile?.last_name}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">Email Address</label>
                        <div className="mt-1 flex items-center gap-2 text-gray-700">
                          <EnvelopeIcon className="h-4 w-4" />
                          {selectedRequest.identity_verification?.user_profile?.email}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">Phone Number</label>
                        <div className="mt-1 flex items-center gap-2 text-gray-700">
                          <PhoneIcon className="h-4 w-4" />
                          {selectedRequest.identity_verification?.user_profile?.phone || 'Not provided'}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">User ID</label>
                        <div className="mt-1 flex items-center gap-2 text-gray-700 font-mono text-sm">
                          <IdentificationIcon className="h-4 w-4" />
                          {selectedRequest.user_id}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Message */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">User's Message</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedRequest.user_message}</p>
                  </div>
                </div>

                {/* Identity Verification */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Identity Verification</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-2 block">Live Photo</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        {selectedRequest.identity_verification?.live_photo ? (
                          <img
                            src={selectedRequest.identity_verification.live_photo}
                            alt="Identity verification photo"
                            className="max-w-full h-48 object-cover rounded-lg mx-auto"
                          />
                        ) : (
                          <div className="flex flex-col items-center py-8">
                            <CameraIcon className="h-12 w-12 text-gray-400 mb-2" />
                            <p className="text-gray-500">No photo provided</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">IP Address</label>
                        <div className="mt-1 flex items-center gap-2 text-gray-700">
                          <GlobeAltIcon className="h-4 w-4" />
                          {selectedRequest.identity_verification?.ip_address}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">User Agent</label>
                        <div className="mt-1 flex items-start gap-2 text-gray-700">
                          <ComputerDesktopIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{selectedRequest.identity_verification?.user_agent}</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">Verification Timestamp</label>
                        <div className="mt-1 flex items-center gap-2 text-gray-700">
                          <ClockIcon className="h-4 w-4" />
                          {selectedRequest.identity_verification?.timestamp ? 
                            new Date(selectedRequest.identity_verification.timestamp).toLocaleString() : 
                            'Not provided'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Admin Notes</h3>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this recovery request..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical min-h-[100px]"
                  />
                </div>

                {/* Action Buttons */}
                {selectedRequest.status === 'pending' && (
                  <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleRequestAction(selectedRequest.id, 'reject')}
                      disabled={actionLoading === selectedRequest.id}
                      className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {actionLoading === selectedRequest.id ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <HandThumbDownIcon className="h-5 w-5" />
                      )}
                      Reject Request
                    </button>

                    <button
                      onClick={() => handleRequestAction(selectedRequest.id, 'approve')}
                      disabled={actionLoading === selectedRequest.id}
                      className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {actionLoading === selectedRequest.id ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <HandThumbUpIcon className="h-5 w-5" />
                      )}
                      Approve Request
                    </button>
                  </div>
                )}

                {selectedRequest.status !== 'pending' && selectedRequest.admin_notes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Previous Admin Notes</p>
                        <p className="text-blue-800 mt-1">{selectedRequest.admin_notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 