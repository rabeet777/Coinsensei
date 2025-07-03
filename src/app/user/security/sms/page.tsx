'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { DevicePhoneMobileIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

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

  // 1) Load user & existing phone
  useEffect(() => {
    if (session === undefined) return // Still loading
    
    if (session === null) {
      router.replace('/auth/login?redirectTo=' + encodeURIComponent('/user/security/sms'))
      return
    }

    // Load phone number from user profile
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
  }, [session, router, supabase])

  // 2) sendSms: save new phone, then ask Twilio to send OTP
  async function sendSms() {
    setMsg(null)
    setLoading(true)

    if (!session?.user) {
      setMsg('❌ Not authenticated')
      setLoading(false)
      return
    }

    // now request Twilio to send the OTP
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

  // 3) verifySms: grab userId and code, then verify on the server
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
        setTimeout(() => router.push('/user/security'), 1500)
      } catch (err) {
        console.error('Error updating security settings:', err)
        setMsg('❌ Failed to update security settings')
      }
    }
  }

  if (session === undefined || phoneLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) return null

  // If no phone number, show message to add phone number
  if (!phone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Phone Number Required</h1>
          <p className="text-gray-600 mb-6">
            You need to add a phone number to your account before setting up SMS verification.
          </p>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-orange-800">
              <strong>Next Steps:</strong><br />
              1. Go to Security Settings<br />
              2. Add your phone number<br />
              3. Return here to setup SMS verification
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/user/security')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <DevicePhoneMobileIcon className="h-5 w-5" />
              Go to Security Settings
            </button>
            <button
              onClick={() => router.push('/user/security')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Back to Security Settings
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
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
            onClick={() => router.push('/user/security')}
            className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            ← Back to Security Settings
          </button>
        </div>
      </div>
    </div>
  )
}
