// src/app/admin/withdrawals/pkr/page.tsx
'use client'

import React, { useState, useEffect, Fragment } from 'react'
import { Tab, Dialog, Transition }             from '@headlessui/react'
import { createClientComponentClient }         from '@supabase/auth-helpers-nextjs'
import { BanknotesIcon, XMarkIcon }            from '@heroicons/react/24/outline'
import { motion }                              from 'framer-motion'
import type { Database }                       from '@/lib/database.types'

type Withdrawal = {
  id:                     string
  user_id:                string
  amount:                 number
  status:                 'pending' | 'approved' | 'rejected'
  method_type:            string
  method_bank_name:       string | null
  method_account_number:  string
  method_iban:            string
  method_account_title:   string
  created_at:             string
  admin_notes:            string | null
  admin_id:               string | null
  admin_screenshot_url:   string | null
  user_profile:           { full_name: string }
}

const TAB_STATUSES = ['pending','approved','rejected'] as const
type TabStatus = typeof TAB_STATUSES[number]

// Constraint name for the FK user_id → user_profile.uid
const USER_PROFILE_CONSTRAINT = 'user_pkr_withdrawals_user_id_fkey'

export default function AdminWithdrawalsPKRPage() {
  const supabase = createClientComponentClient<Database>()

  // page state
  const [list,          setList]          = useState<Withdrawal[]>([])
  const [tab,           setTab]           = useState<TabStatus>('pending')
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState<string|null>(null)

  // modal state
  const [modalOpen,     setModalOpen]     = useState(false)
  const [selected,      setSelected]      = useState<Withdrawal|null>(null)
  const [noteDraft,     setNoteDraft]     = useState('')
  const [adminFile,     setAdminFile]     = useState<File|null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // load all withdrawals + join name
  async function loadAll() {
    setLoading(true)
    const { data, error } = await supabase
      .from('user_pkr_withdrawals')
      .select(`
        *,
        user_profile!${USER_PROFILE_CONSTRAINT}( full_name )
      `)
      .order('created_at',{ ascending: false })

    if (error) {
      setError(error.message)
      setList([])
    } else {
      setList(data as Withdrawal[])
    }
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  function openModal(w: Withdrawal) {
    setSelected(w)
    setNoteDraft(w.admin_notes || '')
    setAdminFile(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setSelected(null)
  }

  async function handleAction(status: 'approved'|'rejected') {
    if (!selected) return
    setActionLoading(true)
    setError(null)

    try {
      // 1) optionally upload an admin proof screenshot
      let screenshotUrl = selected.admin_screenshot_url
      if (adminFile) {
        const path = `withdrawals/${selected.id}_${Date.now()}_${adminFile.name}`
        const { error: upErr } = await supabase
          .storage
          .from('adminwithdrawalproofs')
          .upload(path, adminFile, { upsert: true })
        if (upErr) throw upErr

        const { data: urlData } = supabase
          .storage
          .from('adminwithdrawalproofs')
          .getPublicUrl(path)

        screenshotUrl = urlData.publicUrl
      }

      // 2) adjust the user's wallet
      const { data: w } = await supabase
        .from('user_pkr_wallets')
        .select('balance, locked_balance')
        .eq('user_id', selected.user_id)
        .single()

      if (!w) throw new Error('Wallet not found')

      if (status === 'approved') {
        await supabase
          .from('user_pkr_wallets')
          .update({
            balance:        (w.balance||0) - selected.amount,
            locked_balance: (w.locked_balance||0) - selected.amount
          })
          .eq('user_id', selected.user_id)
      } else {
        // rejected → just unlock
        await supabase
          .from('user_pkr_wallets')
          .update({
            locked_balance: (w.locked_balance||0) - selected.amount
          })
          .eq('user_id', selected.user_id)
      }

      // 3) update the withdrawal row
      const { data:{ session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')

      const { error: updErr } = await supabase
        .from('user_pkr_withdrawals')
        .update({
          status,
          admin_notes:           noteDraft,
          admin_id:              session.user.id,
          admin_screenshot_url:  screenshotUrl
        })
        .eq('id', selected.id)

      if (updErr) throw updErr

      // 4) refresh
      await loadAll()
      closeModal()

    } catch (e: any) {
      setError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const statusClasses = {
    pending:  'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100  text-green-800',
    rejected: 'bg-red-100    text-red-800',
  }

  const tabLabels: Record<TabStatus,string> = {
    pending:  'Pending',
    approved: 'Completed',
    rejected: 'Rejected',
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Admin — PKR Withdrawals</h1>
      {error && <div className="text-red-600">{error}</div>}

      <Tab.Group
        selectedIndex={TAB_STATUSES.indexOf(tab)}
        onChange={i => setTab(TAB_STATUSES[i])}
      >
        <Tab.List className="flex space-x-2 border-b">
          {TAB_STATUSES.map(st => (
            <Tab
              key={st}
              className={({ selected }) =>
                `px-4 py-2 text-sm rounded-t-lg ${
                  selected
                    ? 'bg-white border border-b-0 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {tabLabels[st]}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels>
          {TAB_STATUSES.map(st => (
            <Tab.Panel key={st} className="bg-white p-4 rounded-b-lg shadow-sm">
              {loading ? (
                <p>Loading…</p>
              ) : (
                list.filter(w => w.status === st).length === 0
                  ? <p className="text-gray-500">No {tabLabels[st].toLowerCase()} requests.</p>
                  : (
                    <div className="space-y-3">
                      {list.filter(w => w.status === st).map(w => (
                        <motion.div
                          key={w.id}
                          initial={{ opacity:0, y:10 }}
                          animate={{ opacity:1, y:0 }}
                          className="flex items-center justify-between p-4 border rounded hover:shadow"
                        >
                          <div className="flex items-center space-x-4">
                            <BanknotesIcon className="h-6 w-6 text-blue-500"/>
                            <div>
                              <p className="font-medium">#{w.id}</p>
                              <p className="text-sm text-gray-600">
                                {w.user_profile.full_name} — {w.amount.toLocaleString()} PKR
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => openModal(w)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            View Details
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )
              )}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>

      {/* DETAILS DIALOG */}
      {selected && (
  <Transition appear show={modalOpen} as={Fragment}>
    <Dialog
      as="div"
      className="fixed inset-0 z-50 overflow-y-auto"
      onClose={closeModal}
    >
      {/* BACKDROP — rendered via Transition.Child under the panel */}
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      </Transition.Child>

      {/* CENTERING WRAPPER */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          {/* DIALOG PANEL */}
          <Dialog.Panel className="w-full max-w-xl bg-white rounded-lg shadow-xl p-6 z-10">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-xl font-semibold">
                Withdrawal #{selected.id}
              </Dialog.Title>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* DETAILS */}
            <div className="space-y-4">
              <p><strong>User:</strong> {selected.user_profile.full_name}</p>
              <p><strong>Amount:</strong> {selected.amount.toLocaleString()} PKR</p>
              <p>
                <strong>Status:</strong>{' '}
                <span
                  className={`px-2 py-1 text-sm rounded-full ${
                    statusClasses[selected.status]
                  }`}
                >
                  {selected.status.toUpperCase()}
                </span>
              </p>

              <div className="bg-blue-50 p-4 rounded-lg space-y-1">
                <p className="font-medium">Method: {selected.method_type}</p>
                {selected.method_bank_name && (
                  <p><strong>Bank:</strong> {selected.method_bank_name}</p>
                )}
                <p><strong>Acct #:</strong> {selected.method_account_number}</p>
                <p><strong>IBAN:</strong> {selected.method_iban}</p>
                <p><strong>Title:</strong> {selected.method_account_title}</p>
              </div>

              <label className="block">
                <span className="font-medium">Admin Notes</span>
                <textarea
                  rows={3}
                  className="mt-1 w-full border rounded-lg p-2"
                  value={noteDraft}
                  onChange={e => setNoteDraft(e.target.value)}
                />
              </label>

              <label className="block">
                <span className="font-medium">
                  Attach Screenshot (optional)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1"
                  onChange={e => setAdminFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => handleAction('rejected')}
                disabled={actionLoading || selected.status !== 'pending'}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? '…' : 'Reject'}
              </button>
              <button
                onClick={() => handleAction('approved')}
                disabled={actionLoading || selected.status !== 'pending'}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? '…' : 'Approve'}
              </button>
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </div>
    </Dialog>
  </Transition>
)}    </div>
  )
}
