// components/EmailChangeModal.tsx
'use client'

import React, { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { supabase, updateUserEmail } from '@/lib/supabase'

export interface EmailChangeModalProps {
  open: boolean
  onClose(): void
  /** Called with the new email once change is verified */
  onSuccess(newEmail: string): void
}

export default function EmailChangeModal({
  open,
  onClose,
  onSuccess,
}: EmailChangeModalProps) {
  const [step, setStep] = useState<'enter-email' | 'enter-otp'>('enter-email')
  const [newEmail, setNewEmail] = useState('')
  const [otp, setOtp]       = useState('')
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  /** STEP 1 → send OTP to newEmail */
  const handleSendOtp = async () => {
    setError(null)
    if (!newEmail) {
      setError('Please enter a valid email.')
      return
    }
    setLoading(true)
    // Uses Supabase's signInWithOtp to send a 6‑digit code email
    const { error: sendErr } = await supabase.auth.signInWithOtp({
      email: newEmail,
      options: {
        // no redirect: we'll manually verify
      }
    })
    setLoading(false)
    if (sendErr) {
      setError(sendErr.message)
    } else {
      setStep('enter-otp')
    }
  }

  /** STEP 2 → verify that code and then call updateUserEmail */
  const handleVerifyOtp = async () => {
    setError(null)
    if (!otp) {
      setError('Enter the 6‑digit code.')
      return
    }
    setLoading(true)
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      type: 'signup',         // for email OTP flows v2, use 'signup'
      email: newEmail,
      token: otp,
    })
    if (verifyErr) {
      setError(verifyErr.message)
      setLoading(false)
      return
    }
    try {
      // now actually update the user's email
      await updateUserEmail(newEmail)
      onSuccess(newEmail)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30" />
      <Dialog.Panel className="bg-white p-6 rounded-lg w-80 relative">
        <Dialog.Title className="text-xl font-semibold mb-4">Change Email</Dialog.Title>

        {step === 'enter-email' && (
          <>
            <p className="mb-2">Enter your new email address:</p>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
              placeholder="you@example.com"
            />
            {error && <p className="text-red-500 mb-2 text-sm">{error}</p>}
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Sending code…' : 'Send me a code'}
            </button>
          </>
        )}

        {step === 'enter-otp' && (
          <>
            <p className="mb-2">Enter the 6‑digit code we sent:</p>
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
              placeholder="123456"
            />
            {error && <p className="text-red-500 mb-2 text-sm">{error}</p>}
            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Verify & Change Email'}
            </button>
          </>
        )}
      </Dialog.Panel>
    </Dialog>
  )
}
