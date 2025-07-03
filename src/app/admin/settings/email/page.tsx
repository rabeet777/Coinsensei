'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { toast } from 'sonner'
import { EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import AdminGuard from '../../../../components/admin/AdminGuard'

export default function EmailOtpReauth() {
  const router = useRouter()
  const session = useSession()
  const supabase = useSupabaseClient()

  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'send'|'verify'>('send')
  const [otp, setOtp] = useState('')
  const [msg, setMsg] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)

  // Load current user and lock email field
  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email)
    }
  }, [session])

  // Send the 6-digit code to the user's own email
  const sendOtp = async () => {
    setMsg(null)
    setLoading(true)

    if (!session?.user) {
      setMsg('Authentication error, please log in again.')
      setLoading(false)
      return
    }
    
    if (email.trim() !== session.user.email) {
      setMsg('You must use your own account email.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })

    setLoading(false)
    if (error) {
      if (error.message.includes('not found')) {
        setMsg('That email is not registered.')
      } else {
        setMsg(`Error sending code: ${error.message}`)
      }
    } else {
      setMsg('Code sent - check your inbox.')
      setStep('verify')
    }
  }

  // Verify the 6-digit code, then upsert into user_security
  const verifyCode = async () => {
    setMsg(null)
    setLoading(true)

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp.trim(),
      type: 'email',
    })

    if (error) {
      setMsg(`Invalid code: ${error.message}`)
      setLoading(false)
      return
    }

    // OTP correct! mark email_enabled in user_security table
    try {
      const { error: upsertError } = await supabase
        .from('user_security')
        .upsert(
          [{ user_id: session!.user.id, email_enabled: true }],
          { onConflict: 'user_id' }
        )

      if (upsertError) throw upsertError

      setTimeout(() => toast.success('Email verification enabled.'), 0)
      router.push('/admin/settings')
    } catch (upsertErr: unknown) {
      console.error('Error updating security table:', upsertErr)
      setMsg('Could not update security settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminGuard redirectTo="/admin/settings/email">
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <EnvelopeIcon className="h-16 w-16 text-purple-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {step === 'send' ? 'Setup Email Verification' : 'Verify Your Email'}
          </h1>
          <p className="text-gray-600">
            {step === 'send' 
              ? 'We will send a verification code to your email'
              : 'Enter the 6-digit code sent to your email'
            }
          </p>
        </div>

        {step === 'send' ? (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This is your registered email address
                </p>
              </div>
              
              <button
                onClick={sendOtp}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending Code...' : 'Send Verification Code'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center text-2xl tracking-widest"
                />
              </div>
              
              <button
                onClick={verifyCode}
                disabled={loading || otp.trim().length < 6}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </button>

              <button
                onClick={() => setStep('send')}
                className="w-full text-purple-600 hover:text-purple-700 font-medium py-2 transition-colors"
              >
                Back to Send Code
              </button>
            </div>
          </>
        )}

        {msg && (
          <div className={`p-4 rounded-lg ${
            msg.includes('sent') || msg.includes('enabled') 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm text-center ${
              msg.includes('sent') || msg.includes('enabled') ? 'text-green-800' : 'text-red-800'
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
            Back to Security Settings
          </button>
        </div>
      </div>
    </div>
    </AdminGuard>
  )
} 
