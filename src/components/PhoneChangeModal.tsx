// src/components/PhoneChangeModal.tsx
'use client'
import React, { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'

export interface PhoneChangeModalProps {
  open: boolean
  onClose(): void
  onSuccess(newPhone: string): void
}

type Step = 'enterPhone' | 'enterCode'

export default function PhoneChangeModal({
  open, onClose, onSuccess
}: PhoneChangeModalProps) {
  const session = useSession()
  const supabase = useSupabaseClient()
  const [step, setStep] = useState<Step>('enterPhone')
  const [phone, setPhone] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)

  // Reset when modal opens
  React.useEffect(() => {
    if (open) {
      setStep('enterPhone')
      setPhone('')
      setSmsCode('')
      setError(null)
      setLoading(false)
    }
  }, [open])

  // Send SMS OTP to new phone
  const handleSendSms = async () => {
    setError(null)
    if (!phone.match(/^\+\d{8,15}$/)) {
      setError('Use international format, e.g. +14155552671')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/sms/send', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ phone })
      })
      if (!res.ok) {
        const j = await res.json().catch(()=>({}))
        throw new Error(j.error || res.statusText)
      }
      setStep('enterCode')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Verify SMS OTP and update phone
  const handleVerifySms = async () => {
    setError(null)
    setLoading(true)
    try {
      // Verify SMS code
      const res = await fetch('/api/sms/verify', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ code: smsCode })
      })
      if (!res.ok) {
        const j = await res.json().catch(()=>({}))
        throw new Error(j.error || res.statusText)
      }

      // Update phone in user profile
      const { error: updateError } = await supabase
        .from('user_profile')
        .update({ phone_number: phone })
        .eq('uid', session?.user?.id)

      if (updateError) throw updateError

      onSuccess(phone)
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <Dialog open onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30" />
      <Dialog.Panel className="bg-white p-6 rounded-xl w-96 space-y-6 z-10 max-w-md mx-4">
        <Dialog.Title className="text-xl font-semibold text-gray-800">
          Change Phone Number
        </Dialog.Title>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {step === 'enterPhone' && (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Enter your new phone number. We'll send a verification code to confirm.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use international format with country code
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendSms}
                disabled={loading || !phone}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Code'}
              </button>
            </div>
          </div>
        )}

        {step === 'enterCode' && (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Enter the 6-digit code sent to <strong>{phone}</strong>
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setStep('enterPhone')}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleVerifySms}
                disabled={loading || smsCode.length !== 6}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Update'}
              </button>
            </div>
          </div>
        )}
      </Dialog.Panel>
    </Dialog>
  )
}
