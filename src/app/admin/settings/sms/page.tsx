'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { DevicePhoneMobileIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import AdminGuard from '../../../../components/admin/AdminGuard'
import PhoneNumberSetup from '../../../../components/admin/PhoneNumberSetup'

export default function SmsSetupPage() {
  const router = useRouter()
  const session = useSession()
  const supabase = useSupabaseClient()
  
  const [step, setStep] = useState<'send'|'verify'>('send')
  const [code, setCode] = useState('')
  const [phone, setPhone] = useState<string|null>(null)
  const [msg, setMsg] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)
  const [phoneLoading, setPhoneLoading] = useState(true)

  // Load existing phone number
  useEffect(() => {
    if (!session?.user?.id) return

    async function loadPhone() {
      setPhoneLoading(true)
      try {
        const { data, error } = await supabase
          .from('user_profile')
          .select('phone_number')
          .eq('uid', session!.user.id)
          .single()

        if (!error && data?.phone_number) {
          setPhone(data.phone_number)
        } else {
          setPhone(null)
        }
      } catch (err) {
        console.error('Error loading phone:', err)
        setPhone(null)
      } finally {
        setPhoneLoading(false)
      }
    }

    loadPhone()
  }, [session, supabase])

  // Send SMS
  async function sendSms() {
    setMsg(null)
    setLoading(true)

    if (!session?.user) {
      setMsg('❌ Not authenticated')
      setLoading(false)
      return
    }

    const res = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })

    setLoading(false)
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setMsg('❌ ' + (json.error || res.statusText))
    } else {
      setMsg('✅ Code sent to your phone')
      setStep('verify')
    }
  }

  // Verify SMS
  async function verifySms() {
    setMsg(null)
    setLoading(true)

    if (!session?.user) {
      setMsg('❌ Not authenticated')
      setLoading(false)
      return
    }

    const res = await fetch('/api/sms/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, userId: session.user.id }),
    })

    setLoading(false)
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setMsg('❌ ' + (json.error || res.statusText))
    } else {
      // Update user_security table to mark SMS as enabled
      try {
        const { error: upsertError } = await supabase
          .from('user_security')
          .upsert(
            [{ user_id: session.user.id, sms_enabled: true }],
            { onConflict: 'user_id' }
          )

        if (upsertError) throw upsertError

        setMsg('🎉 SMS verification enabled!')
        setTimeout(() => router.push('/admin/settings'), 1500)
      } catch (err) {
        console.error('Error updating security settings:', err)
        setMsg('❌ Failed to update security settings')
      }
    }
  }

  return (
    <AdminGuard redirectTo="/admin/settings/sms">
      {phoneLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : !phone ? (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
          <PhoneNumberSetup
            onPhoneUpdate={(newPhone) => setPhone(newPhone)}
            onClose={() => router.push('/admin/settings')}
          />
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <div className="text-center">
              <DevicePhoneMobileIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {step === 'send' ? 'Setup SMS Verification' : 'Verify Your Phone'}
              </h1>
              <p className="text-gray-600">
                {step === 'send' 
                  ? 'We will send a verification code to your phone'
                  : 'Enter the 6-digit code sent to your phone'
                }
              </p>
            </div>

            {phone && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm text-center">
                  <strong>Phone Number:</strong> {phone}
                </p>
              </div>
            )}

            {step === 'send' ? (
              <div className="space-y-4">
                <button
                  onClick={sendSms}
                  disabled={loading || !phone}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending Code...' : 'Send SMS Code'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-2xl tracking-widest"
                  />
                </div>
                
                <button
                  onClick={verifySms}
                  disabled={loading || code.length < 6}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify & Enable'}
                </button>

                <button
                  onClick={() => setStep('send')}
                  className="w-full text-green-600 hover:text-green-700 font-medium py-2 transition-colors"
                >
                  ← Back to Send Code
                </button>
              </div>
            )}

            {msg && (
              <div className={`p-4 rounded-lg ${
                msg.startsWith('✅') || msg.startsWith('🎉') 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`text-sm text-center ${
                  msg.startsWith('✅') || msg.startsWith('🎉') ? 'text-green-800' : 'text-red-800'
                }`}>
                  {msg}
                </p>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => router.push('/admin/settings')}
                className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
                ← Back to Security Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminGuard>
  )
} 