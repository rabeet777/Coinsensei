'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeftIcon,
  ShieldCheckIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import type { Database } from '@/lib/database.types'

interface SecurityMethods {
  totp_enabled: boolean
  sms_enabled: boolean
  email_enabled: boolean
}

type Step = 'email' | 'security-check' | 'verification' | 'reset-sent'

export default function ForgotPasswordPage() {
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  // Form state
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // User security methods
  const [userId, setUserId] = useState<string | null>(null)
  const [securityMethods, setSecurityMethods] = useState<SecurityMethods | null>(null)
  const [userPhone, setUserPhone] = useState<string | null>(null)

  // Verification states
  const [totpVerified, setTotpVerified] = useState(false)
  const [smsVerified, setSmsVerified] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  
  // Input states
  const [totpCode, setTotpCode] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [emailCode, setEmailCode] = useState('')
  
  // Loading states for individual verifications
  const [totpLoading, setTotpLoading] = useState(false)
  const [smsLoading, setSmsLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)

  // Step 1: Check if user exists and get their security methods
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      console.log('Starting password reset for email:', email)
      
      // Call API to check user and security methods
      const res = await fetch('/api/password-reset/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()
      console.log('User check result:', data)

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process request')
      }

      if (!data.userExists) {
        // User doesn't exist, show reset-sent for security
        console.log('User not found, proceeding to reset-sent state')
        setStep('reset-sent')
        setLoading(false)
        return
      }

      // User exists, set the data
      setUserId(data.userId)
      setUserPhone(data.phoneNumber)
      setSecurityMethods(data.securityMethods)

      console.log('Found user with security methods:', data.securityMethods)

      // Check if user has any security methods enabled
      const hasSecurityMethods = data.securityMethods.totp_enabled || 
                                 data.securityMethods.sms_enabled || 
                                 data.securityMethods.email_enabled

      if (hasSecurityMethods) {
        console.log('User has security methods, showing security-check step')
        setStep('security-check')
      } else {
        // No security methods, can proceed directly to password reset
        console.log('No security methods found, proceeding directly to password reset')
        await sendPasswordResetEmail()
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process request'
      console.error('Email submit error:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Step 2: User confirms they want to verify security methods
  const proceedToVerification = () => {
    setStep('verification')
    // Auto-send email code if email verification is enabled
    if (securityMethods?.email_enabled) {
      sendEmailCode()
    }
  }

  // Send SMS code for verification
  const sendSmsCode = async () => {
    setSmsLoading(true)
    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: userPhone,
          user_id: userId,
          action: 'password_reset' 
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to send SMS')
      }

      toast.success('SMS verification code sent')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send SMS code'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSmsLoading(false)
    }
  }

  // Send email code for verification
  const sendEmailCode = async () => {
    setEmailLoading(true)
    try {
      const res = await fetch('/api/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          action: 'password_reset'
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to send email code')
      }

      toast.success('Email verification code sent')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email code'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setEmailLoading(false)
    }
  }

  // Verify TOTP code
  const verifyTotp = async () => {
    if (!totpCode || totpCode.length !== 6) return
    setTotpLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/security/verify-totp-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: totpCode,
          user_id: userId,
          action: 'password_reset'
        })
      })
      
      if (res.ok) {
        setTotpVerified(true)
        setTotpCode('')
        toast.success('TOTP verified successfully')
      } else {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Invalid TOTP code')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid TOTP code'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setTotpLoading(false)
    }
  }

  // Verify SMS code
  const verifySms = async () => {
    if (!smsCode || smsCode.length !== 6) return
    setSmsLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/sms/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: smsCode, 
          user_id: userId,
          action: 'password_reset'
        })
      })
      
      if (res.ok) {
        setSmsVerified(true)
        setSmsCode('')
        toast.success('SMS verified successfully')
      } else {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Invalid SMS code')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid SMS code'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSmsLoading(false)
    }
  }

  // Verify Email code
  const verifyEmail = async () => {
    if (!emailCode || emailCode.length !== 6) return
    setEmailLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          code: emailCode,
          action: 'password_reset'
        })
      })
      
      if (res.ok) {
        setEmailVerified(true)
        setEmailCode('')
        toast.success('Email verified successfully')
      } else {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Invalid email code')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid email code'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setEmailLoading(false)
    }
  }

  // Check if all required verifications are complete
  const allVerificationsComplete = 
    (!securityMethods?.totp_enabled || totpVerified) &&
    (!securityMethods?.sms_enabled || smsVerified) &&
    (!securityMethods?.email_enabled || emailVerified)

  // Send password reset email after security verification
  const sendPasswordResetEmail = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('Sending password reset email to:', email)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        console.error('Supabase password reset error:', error)
        throw error
      }

      console.log('Password reset email sent successfully')
      setStep('reset-sent')
      toast.success('Password reset email sent!')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email'
      console.error('Password reset email error:', err)
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Complete verification and send reset email
  const completeVerificationAndReset = async () => {
    if (!allVerificationsComplete) return
    await sendPasswordResetEmail()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {/* Step 1: Email Input */}
          {step === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="text-center mb-8">
                <LockClosedIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                  Reset Password
                </h1>
                <p className="text-gray-600">Enter your email to reset your password</p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your email address"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Continue'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => router.push('/auth/login')}
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Login
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Security Check Information */}
          {step === 'security-check' && securityMethods && (
            <motion.div
              key="security-check"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="text-center mb-8">
                <ShieldCheckIcon className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Security Verification Required</h2>
                <p className="text-gray-600">For your security, we need to verify your identity before resetting your password.</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-amber-800">Security Methods Detected</h3>
                    <p className="text-amber-700 text-sm mt-1">
                      You have the following security methods enabled. You'll need to verify them before we can send a password reset email.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {securityMethods.totp_enabled && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <KeyIcon className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800">Authenticator App (TOTP)</span>
                  </div>
                )}
                {securityMethods.sms_enabled && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <DevicePhoneMobileIcon className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">SMS Verification</span>
                  </div>
                )}
                {securityMethods.email_enabled && (
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <EnvelopeIcon className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-800">Email Verification</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <button
                  onClick={proceedToVerification}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
                >
                  Proceed to Verification
                </button>

                <button
                  onClick={() => router.push('/auth/login')}
                  className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-4 px-6 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Security Verification */}
          {step === 'verification' && securityMethods && (
            <motion.div
              key="verification"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="text-center mb-8">
                <ShieldCheckIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Identity</h2>
                <p className="text-gray-600">Complete all required verification steps</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4 mb-6">
                {/* TOTP Verification */}
                {securityMethods.totp_enabled && (
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
                          placeholder="Enter 6-digit TOTP code"
                          value={totpCode}
                          onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                          maxLength={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={verifyTotp}
                          disabled={totpLoading || totpCode.length !== 6}
                          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {totpLoading ? 'Verifying...' : 'Verify TOTP'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* SMS Verification */}
                {securityMethods.sms_enabled && (
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
                          placeholder="Enter SMS verification code"
                          value={smsCode}
                          onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
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
                {securityMethods.email_enabled && (
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
                          placeholder="Enter email verification code"
                          value={emailCode}
                          onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ''))}
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

              {allVerificationsComplete && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-800 font-medium">All verifications complete!</span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <button
                  onClick={completeVerificationAndReset}
                  disabled={!allVerificationsComplete || loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending Reset Email...' : 'Send Password Reset Email'}
                </button>

                <button
                  onClick={() => router.push('/auth/login')}
                  className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-4 px-6 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Reset Email Sent */}
          {step === 'reset-sent' && (
            <motion.div
              key="reset-sent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="text-center">
                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Reset Email Sent!</h2>
                <p className="text-gray-600 mb-6">
                  If an account with that email exists, we've sent you a password reset link.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-semibold text-blue-800 mb-2">Next Steps:</h3>
                  <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
                    <li>Check your email inbox (and spam folder)</li>
                    <li>Click the password reset link</li>
                    <li>Create a new strong password</li>
                    <li>Log in with your new password</li>
                  </ol>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
                  >
                    Back to Login
                  </button>
                  
                  <button
                    onClick={() => setStep('email')}
                    className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-4 px-6 rounded-lg transition-colors"
                  >
                    Try Different Email
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 