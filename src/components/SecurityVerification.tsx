'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheckIcon, 
  KeyIcon, 
  DevicePhoneMobileIcon, 
  EnvelopeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface SecurityMethod {
  totp_enabled: boolean
  sms_enabled: boolean
  email_enabled: boolean
}

interface SecurityVerificationProps {
  onVerificationComplete: () => void
  onCancel: () => void
  title?: string
  description?: string
}

export default function SecurityVerification({ 
  onVerificationComplete, 
  onCancel, 
  title = "Security Verification Required",
  description = "Please verify your identity to proceed with this withdrawal."
}: SecurityVerificationProps) {
  const router = useRouter()
  const session = useSession()
  const supabase = useSupabaseClient()

  const [securityMethods, setSecurityMethods] = useState<SecurityMethod | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'check' | 'verify'>('check')
  
  // Verification states
  const [totpVerified, setTotpVerified] = useState(false)
  const [smsVerified, setSmsVerified] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  
  // Input states
  const [totpCode, setTotpCode] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [emailCode, setEmailCode] = useState('')
  
  // Loading states
  const [totpLoading, setTotpLoading] = useState(false)
  const [smsLoading, setSmsLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  
  const [error, setError] = useState<string | null>(null)

  // Check user's security methods
  useEffect(() => {
    if (!session?.user?.id) return

    async function checkSecurityMethods() {
      try {
        const { data, error } = await supabase
          .from('user_security')
          .select('totp_enabled, sms_enabled, email_enabled')
          .eq('user_id', session!.user.id)
          .single()

        if (error && error.code === 'PGRST116') {
          // No security methods setup
          setSecurityMethods({ totp_enabled: false, sms_enabled: false, email_enabled: false })
        } else if (error) {
          throw error
        } else {
          setSecurityMethods(data)
        }
      } catch (err) {
        console.error('Error checking security methods:', err)
        setError('Failed to load security settings')
      } finally {
        setLoading(false)
      }
    }

    checkSecurityMethods()
  }, [session, supabase])

  // Check if user has enough security methods
  const enabledMethodsCount = securityMethods 
    ? (securityMethods.totp_enabled ? 1 : 0) + 
      (securityMethods.sms_enabled ? 1 : 0) + 
      (securityMethods.email_enabled ? 1 : 0)
    : 0

  const hasEnoughMethods = enabledMethodsCount >= 2

  // Check if all required verifications are complete
  const allVerificationsComplete = 
    (!securityMethods?.totp_enabled || totpVerified) &&
    (!securityMethods?.sms_enabled || smsVerified) &&
    (!securityMethods?.email_enabled || emailVerified)

  // Send SMS code
  const sendSmsCode = async () => {
    if (!session?.user?.id) return
    setSmsLoading(true)
    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: session.user.phone || '' })
      })
      if (!res.ok) throw new Error('Failed to send SMS')
    } catch (err) {
      setError('Failed to send SMS code')
    } finally {
      setSmsLoading(false)
    }
  }

  // Send email code
  const sendEmailCode = async () => {
    if (!session?.user?.email) return
    setEmailLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: session.user.email,
        options: { shouldCreateUser: false }
      })
      if (error) throw error
    } catch (err) {
      setError('Failed to send email code')
    } finally {
      setEmailLoading(false)
    }
  }

  // Verify TOTP
  const verifyTotp = async () => {
    if (!totpCode || totpCode.length !== 6) return
    setTotpLoading(true)
    setError(null) // Clear previous errors
    try {
      const res = await fetch('/api/security/verify-totp-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totpCode })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setTotpVerified(true)
        setTotpCode('')
        setError(null) // Clear any errors on success
      } else {
        throw new Error(data.error || 'Invalid TOTP code')
      }
    } catch (err: any) {
      console.error('TOTP verification error:', err)
      setError(err.message || 'Invalid TOTP code. Please try again.')
    } finally {
      setTotpLoading(false)
    }
  }

  // Verify SMS
  const verifySms = async () => {
    if (!smsCode || smsCode.length !== 6) return
    setSmsLoading(true)
    setError(null) // Clear previous errors
    try {
      const res = await fetch('/api/sms/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: smsCode, userId: session?.user?.id })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setSmsVerified(true)
        setSmsCode('')
        setError(null) // Clear any errors on success
      } else {
        throw new Error(data.error || 'Invalid SMS code')
      }
    } catch (err: any) {
      console.error('SMS verification error:', err)
      setError(err.message || 'Invalid SMS code. Please try again.')
    } finally {
      setSmsLoading(false)
    }
  }

  // Verify Email
  const verifyEmail = async () => {
    if (!emailCode || emailCode.length !== 6) return
    setEmailLoading(true)
    setError(null) // Clear previous errors
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: session?.user?.email || '',
        token: emailCode,
        type: 'email'
      })
      if (!error) {
        setEmailVerified(true)
        setEmailCode('')
        setError(null) // Clear any errors on success
      } else {
        throw new Error(error.message || 'Invalid email code')
      }
    } catch (err: any) {
      console.error('Email verification error:', err)
      setError(err.message || 'Invalid email code. Please try again.')
    } finally {
      setEmailLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If user doesn't have enough security methods
  if (!hasEnoughMethods) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8"
      >
        <div className="text-center mb-6">
          <ExclamationTriangleIcon className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Additional Security Required</h2>
          <p className="text-gray-600">
            You need at least 2 security methods enabled to make withdrawals.
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-orange-800 mb-2">Current Security Methods:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <KeyIcon className="h-4 w-4" />
                Authenticator App
              </span>
              <span className={`px-2 py-1 rounded text-xs ${securityMethods?.totp_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                {securityMethods?.totp_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DevicePhoneMobileIcon className="h-4 w-4" />
                SMS Verification
              </span>
              <span className={`px-2 py-1 rounded text-xs ${securityMethods?.sms_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                {securityMethods?.sms_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <EnvelopeIcon className="h-4 w-4" />
                Email Verification
              </span>
              <span className={`px-2 py-1 rounded text-xs ${securityMethods?.email_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                {securityMethods?.email_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/user/security')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Setup Security Methods
          </button>
          <button
            onClick={onCancel}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Cancel Withdrawal
          </button>
        </div>
      </motion.div>
    )
  }

  // Verification step
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8"
    >
      <div className="text-center mb-6">
        <ShieldCheckIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* TOTP Verification */}
        {securityMethods?.totp_enabled && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <KeyIcon className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Authenticator App</span>
              </div>
              {totpVerified && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
            </div>
            {!totpVerified && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={verifyTotp}
                  disabled={totpLoading || totpCode.length !== 6}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {totpLoading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* SMS Verification */}
        {securityMethods?.sms_enabled && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DevicePhoneMobileIcon className="h-5 w-5 text-green-600" />
                <span className="font-medium">SMS Verification</span>
              </div>
              {smsVerified && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
            </div>
            {!smsVerified && (
              <div className="space-y-2">
                <button
                  onClick={sendSmsCode}
                  disabled={smsLoading}
                  className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50 mb-2"
                >
                  {smsLoading ? 'Sending...' : 'Send SMS Code'}
                </button>
                <input
                  type="text"
                  placeholder="Enter SMS code"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value)}
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <button
                  onClick={verifySms}
                  disabled={smsLoading || smsCode.length !== 6}
                  className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {smsLoading ? 'Verifying...' : 'Verify SMS'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Email Verification */}
        {securityMethods?.email_enabled && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <EnvelopeIcon className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Email Verification</span>
              </div>
              {emailVerified && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
            </div>
            {!emailVerified && (
              <div className="space-y-2">
                <button
                  onClick={sendEmailCode}
                  disabled={emailLoading}
                  className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 mb-2"
                >
                  {emailLoading ? 'Sending...' : 'Send Email Code'}
                </button>
                <input
                  type="text"
                  placeholder="Enter email code"
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value)}
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <button
                  onClick={verifyEmail}
                  disabled={emailLoading || emailCode.length !== 6}
                  className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {emailLoading ? 'Verifying...' : 'Verify Email'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3">
        <button
          onClick={onVerificationComplete}
          disabled={!allVerificationsComplete}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {allVerificationsComplete ? 'Proceed with Withdrawal' : 'Complete All Verifications'}
        </button>
        <button
          onClick={onCancel}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  )
} 