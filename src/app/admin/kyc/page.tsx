// src/app/admin/kyc/page.tsx
'use client'

import React, { useState, useEffect, Fragment } from 'react'
import { Dialog, Transition, Tab }            from '@headlessui/react'
import { createClientComponentClient }        from '@supabase/auth-helpers-nextjs'
import { motion, AnimatePresence }            from 'framer-motion'
import type { Database }                      from '@/lib/database.types'
import {
  XMarkIcon,
  UserIcon,
  DocumentTextIcon,
  IdentificationIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  CalendarIcon,
  MapPinIcon,
  CameraIcon,
  MagnifyingGlassIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  UserGroupIcon,
  DocumentDuplicateIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

// Match your actual FK constraint for joining to user_profile.uid
const USER_PROFILE_FK = 'user_kyc_submissions_user_id_fkey1'

type Submission = {
  id:             string
  user_id:        string
  doc_type:       string
  front_url:      string | null
  back_url:       string | null
  address_url:    string | null
  face_image_url: string | null
  kyc_status:     'not_submitted' | 'pending' | 'approved' | 'rejected'
  created_at:     string
  admin_notes:    string | null
  admin_id:       string | null
  user_profile: {
    full_name:   string | null
    cnic_number: string | null
  }
}

const TAB_STATUSES = ['pending','approved','rejected'] as const
type TabStatus = typeof TAB_STATUSES[number]

export default function AdminKycPage() {
  const supabase = createClientComponentClient<Database>()
  const [list,      setList]      = useState<Submission[]>([])
  const [tab,       setTab]       = useState<TabStatus>('pending')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string|null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [open,      setOpen]      = useState(false)
  const [current,   setCurrent]   = useState<Submission|null>(null)
  const [note,      setNote]      = useState('')
  const [fullName,  setFullName]  = useState('')
  const [cnic,      setCnic]      = useState('')
  const [actioning, setActioning] = useState(false)

  // 1) load from DB
  async function load() {
    setLoading(true)
    setError(null)
    try {
    const { data, error } = await supabase
      .from('user_kyc_submissions')
      .select(`
        *,
        user_profile!${USER_PROFILE_FK}(full_name, cnic_number)
      `)
      .order('created_at', { ascending: false })

      if (error) throw error
      setList(data as Submission[])
    } catch (err: any) {
      setError(err.message)
    } finally {
    setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function openDialog(s: Submission) {
    setCurrent(s)
    setNote(s.admin_notes || '')
    setFullName(s.user_profile.full_name || '')
    setCnic(s.user_profile.cnic_number || '')
    setOpen(true)
  }

  function closeDialog() {
    setOpen(false)
    setCurrent(null)
  }

  // 2) handle approve/reject
  async function handle(status: 'approved'|'rejected') {
    if (!current) return
    setActioning(true)
    setError(null)
    try {
      // 1) update user_profile
      const { error: profErr } = await supabase
        .from('user_profile')
        .update({
          full_name:   fullName,
          cnic_number: cnic,
          kyc_status:  status
        })
        .eq('uid', current.user_id)
      if (profErr) throw profErr
  
      // 2) update user_kyc_submissions
      const {
        data: sessionData,
        error: sessErr
      } = await supabase.auth.getSession()
      if (sessErr || !sessionData?.session) throw sessErr || new Error('No session')
  
      const { error: subErr } = await supabase
        .from('user_kyc_submissions')
        .update({
          kyc_status:  status,
          admin_notes: note,
          admin_id:    sessionData.session.user.id
        })
        .eq('id', current.id)
      if (subErr) throw subErr
  
      // 3) reload from DB so both tables are in sync
      await load()
  
      // 4) switch tab & close modal
      setTab(status)
      closeDialog()
    } catch (e: any) {
      console.error('KYC update failed', e)
      setError(e.message)
    } finally {
      setActioning(false)
    }
  }

  const statusConfig = {
    not_submitted: { 
      classes: 'bg-gray-100 text-gray-800 border-gray-200', 
      icon: DocumentTextIcon, 
      color: 'gray' 
    },
    pending: { 
      classes: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      icon: ClockIcon, 
      color: 'yellow' 
    },
    approved: { 
      classes: 'bg-green-100 text-green-800 border-green-200', 
      icon: CheckCircleIcon, 
      color: 'green' 
    },
    rejected: { 
      classes: 'bg-red-100 text-red-800 border-red-200', 
      icon: XCircleIcon, 
      color: 'red' 
    },
  }

  const labels: Record<TabStatus,string> = {
    pending:  'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
  }

  // Filter submissions based on search query
  const filteredList = list.filter(submission => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      submission.id.toLowerCase().includes(query) ||
      submission.user_profile.full_name?.toLowerCase().includes(query) ||
      submission.user_profile.cnic_number?.toLowerCase().includes(query) ||
      submission.doc_type.toLowerCase().includes(query)
    )
  })

  // Calculate statistics
  const stats = {
    total: list.length,
    pending: list.filter(s => s.kyc_status === 'pending').length,
    approved: list.filter(s => s.kyc_status === 'approved').length,
    rejected: list.filter(s => s.kyc_status === 'rejected').length,
  }

  const getDocumentIcon = (docType: string) => {
    switch (docType.toLowerCase()) {
      case 'cnic':
      case 'national_id':
        return IdentificationIcon
      case 'passport':
        return DocumentTextIcon
      case 'driving_license':
        return DocumentDuplicateIcon
      default:
        return DocumentTextIcon
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 bg-clip-text text-transparent">
                KYC Management
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Review and manage user identity verification submissions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="h-12 w-12 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
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
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, CNIC, or submission ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ChartBarIcon className="h-5 w-5" />
              )}
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200"
        >
      <Tab.Group
        selectedIndex={TAB_STATUSES.indexOf(tab)}
        onChange={i=>setTab(TAB_STATUSES[i])}
      >
            <div className="border-b border-gray-200">
              <Tab.List className="flex">
                {TAB_STATUSES.map((status, index) => {
                  const StatusIcon = statusConfig[status].icon
                  const count = filteredList.filter(x => x.kyc_status === status).length
                  
                  return (
                    <Tab key={status}
              className={({ selected }) =>
                        `flex-1 flex items-center justify-center gap-3 px-6 py-4 text-sm font-medium transition-all ${
                  selected
                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`
                      }>
                      <StatusIcon className="h-5 w-5" />
                      {labels[status]}
                      {count > 0 && (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          tab === status 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {count}
                        </span>
                      )}
            </Tab>
                  )
                })}
        </Tab.List>
            </div>

        <Tab.Panels>
              {TAB_STATUSES.map(status => (
                <Tab.Panel key={status} className="p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading submissions...</p>
                      </div>
                    </div>
                  ) : filteredList.filter(x=>x.kyc_status===status).length === 0 ? (
                    <div className="text-center py-12">
                      <DocumentMagnifyingGlassIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-xl font-medium text-gray-600 mb-2">
                        No {labels[status].toLowerCase()} submissions
                      </p>
                      <p className="text-gray-500">
                        {searchQuery ? 'Try adjusting your search criteria' : 'All clear for now!'}
                            </p>
                          </div>
                  ) : (
                    <div className="grid gap-4">
                      <AnimatePresence>
                        {filteredList.filter(x=>x.kyc_status===status).map((submission, index)=> {
                          const StatusIcon = statusConfig[submission.kyc_status].icon
                          const DocIcon = getDocumentIcon(submission.doc_type)
                          
                          return (
                            <motion.div 
                              key={submission.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ delay: index * 0.05 }}
                              className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                    <DocIcon className="h-6 w-6 text-white" />
                                  </div>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h3 className="text-lg font-semibold text-gray-900">
                                        {submission.user_profile.full_name || 'No Name Provided'}
                                      </h3>
                                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig[submission.kyc_status].classes}`}>
                                        <StatusIcon className="h-3 w-3" />
                                        {submission.kyc_status.replace('_', ' ').toUpperCase()}
                                      </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                                      <div className="flex items-center gap-2">
                                        <IdentificationIcon className="h-4 w-4" />
                                        <span>ID: {submission.id.toString().slice(0, 8)}...</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <DocumentTextIcon className="h-4 w-4" />
                                        <span>{submission.doc_type.replace('_', ' ').toUpperCase()}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4" />
                                        <span>{new Date(submission.created_at).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                    
                                    {submission.user_profile.cnic_number && (
                                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                                        <UserIcon className="h-4 w-4" />
                                        <span>CNIC: {submission.user_profile.cnic_number}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <div className="flex -space-x-1">
                                    {submission.front_url && (
                                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white">
                                        <CameraIcon className="h-4 w-4 text-blue-600" />
                                      </div>
                                    )}
                                    {submission.back_url && (
                                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center border-2 border-white">
                                        <DocumentTextIcon className="h-4 w-4 text-green-600" />
                                      </div>
                                    )}
                                    {submission.face_image_url && (
                                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center border-2 border-white">
                                        <UserIcon className="h-4 w-4 text-purple-600" />
                                      </div>
                                    )}
                                  </div>
                                  
                          <button
                                    onClick={() => openDialog(submission)}
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
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
        </motion.div>
      </div>

      {/* ENHANCED DETAILS MODAL */}
      <AnimatePresence>
      {open && current && (
        <Transition appear show={open} as={Fragment}>
          <Dialog
            as="div"
            className="fixed inset-0 z-50 overflow-y-auto"
            open={open}
            onClose={closeDialog}
          >
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                  enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel
                  as={motion.div}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
                  >
                    {/* Modal Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <Dialog.Title className="text-2xl font-bold">
                            KYC Review - {current.user_profile.full_name || 'Unknown User'}
                    </Dialog.Title>
                          <p className="text-blue-100 mt-1">
                            Submission ID: {current.id}
                          </p>
                        </div>
                        <button 
                          onClick={closeDialog} 
                          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                          <XMarkIcon className="h-6 w-6" />
                    </button>
                      </div>
                  </div>

                    {/* Modal Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {/* Status and Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <UserIcon className="h-5 w-5" />
                            Current Status
                          </h3>
                          <div className="flex items-center gap-3">
                            {React.createElement(statusConfig[current.kyc_status].icon, {
                              className: "h-8 w-8 text-gray-600"
                            })}
                            <span className={`px-3 py-2 rounded-lg font-medium border ${statusConfig[current.kyc_status].classes}`}>
                              {current.kyc_status.replace('_', ' ').toUpperCase()}
                    </span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            Submission Date
                          </h3>
                          <p className="text-gray-700">
                            {new Date(current.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Document Images */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <DocumentTextIcon className="h-5 w-5" />
                          Submitted Documents
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          {[
                            { url: current.front_url, label: 'Front ID', icon: IdentificationIcon },
                            { url: current.back_url, label: 'Back ID', icon: DocumentTextIcon },
                            { url: current.address_url, label: 'Address Proof', icon: MapPinIcon },
                            { url: current.face_image_url, label: 'Face Photo', icon: CameraIcon }
                          ].map((doc, index) => (
                            doc.url ? (
                              <div key={index} className="group relative">
                                <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors">
                                  <img 
                                    src={doc.url} 
                                    alt={doc.label}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                </div>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl flex items-center justify-center">
                                  <a 
                                    href={doc.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-medium text-gray-900 transition-opacity"
                                  >
                                    View Full Size
                                  </a>
                                </div>
                                <p className="text-center text-sm font-medium text-gray-700 mt-2 flex items-center justify-center gap-1">
                                  <doc.icon className="h-4 w-4" />
                                  {doc.label}
                                </p>
                              </div>
                            ) : (
                              <div key={index} className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                                <doc.icon className="h-8 w-8 mb-2" />
                                <p className="text-sm">{doc.label}</p>
                                <p className="text-xs">Not provided</p>
                              </div>
                            )
                          ))}
                        </div>
                  </div>

                      {/* Edit Form */}
                      <div className="bg-blue-50 rounded-xl p-6">
                        <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                          <DocumentDuplicateIcon className="h-5 w-5" />
                          Review Information
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Full Name
                            </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter full name"
                      />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              CNIC Number
                    </label>
                      <input
                        type="text"
                        value={cnic}
                        onChange={e => setCnic(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter CNIC number"
                      />
                          </div>
                  </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Admin Notes
                          </label>
                    <textarea
                            rows={4}
                      value={note}
                      onChange={e => setNote(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Add any notes about this submission..."
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={closeDialog}
                          className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        
                        {current.kyc_status === 'pending' && (
                          <>
                    <button
                      onClick={() => handle('rejected')}
                              disabled={actioning}
                              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                              {actioning ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <XCircleIcon className="h-5 w-5" />
                              )}
                              Reject
                    </button>
                            
                    <button
                      onClick={() => handle('approved')}
                              disabled={actioning}
                              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                              {actioning ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <CheckCircleIcon className="h-5 w-5" />
                              )}
                              Approve
                    </button>
                          </>
                        )}
                      </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>
      )}
      </AnimatePresence>
    </div>
  )
}
