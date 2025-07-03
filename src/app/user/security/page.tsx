'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import PhoneChangeModal from '@/components/PhoneChangeModal'
import PasswordChangeModal from '@/components/PasswordChangeModal'
import SecurityGuard from '@/components/SecurityGuard'
import { 
  AtSymbolIcon, 
  XMarkIcon, 
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  LockClosedIcon,
  CogIcon,
  TrashIcon,
  QrCodeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface EmailChangeModalProps {
  isOpen: boolean
  onClose: () => void
  currentSecurity: {
    totp_enabled: boolean
    sms_enabled: boolean
    email_enabled: boolean
  }
  onSuccess: () => void
}

function EmailChangeModal({ isOpen, onClose, currentSecurity, onSuccess }: EmailChangeModalProps) {
  const supabase = useSupabaseClient()
  const session = useSession()
  const [step, setStep] = useState<'email' | 'verify'>('email')
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [codes, setCodes] = useState({ totp: '', sms: '', email: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const enabledMethodsCount = 
    (currentSecurity.totp_enabled ? 1 : 0) + 
    (currentSecurity.sms_enabled ? 1 : 0) + 
    (currentSecurity.email_enabled ? 1 : 0)

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const getRequiredVerifications = () => {
    const required: Array<{ method: keyof typeof codes; label: string }> = []
    
    if (currentSecurity.totp_enabled) required.push({ method: 'totp', label: 'Authenticator App' })
    if (currentSecurity.sms_enabled) required.push({ method: 'sms', label: 'SMS' })
    if (currentSecurity.email_enabled) required.push({ method: 'email', label: 'Email' })
    
    return required
  }

  const sendSmsCode = async () => {
    try {
      const response = await fetch('/api/send-sms-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session?.user.id })
      })
      
      if (!response.ok) throw new Error('Failed to send SMS code')
      toast.success('SMS code sent!')
    } catch (error) {
      console.error('SMS send error:', error)
      toast.error('Failed to send SMS code')
    }
  }

  const sendEmailCode = async () => {
    try {
      const response = await fetch('/api/send-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session?.user.id })
      })
      
      if (!response.ok) throw new Error('Failed to send email code')
      toast.success('Email code sent!')
    } catch (error) {
      console.error('Email send error:', error)
      toast.error('Failed to send email code')
    }
  }

  const verifyMethod = async (method: keyof typeof codes) => {
    try {
      const response = await fetch('/api/verify-security-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.user.id,
          method,
          code: codes[method]
        })
      })
      
      if (!response.ok) throw new Error(`${method.toUpperCase()} verification failed`)
      return true
    } catch (error) {
      console.error(`${method} verification error:`, error)
      setErrors(prev => ({ ...prev, [method]: `Invalid ${method.toUpperCase()} code` }))
      return false
    }
  }

  const handleEmailSubmit = () => {
    setErrors({})
    
    if (!newEmail) {
      setErrors({ email: 'Email is required' })
      return
    }
      
    if (!validateEmail(newEmail)) {
      setErrors({ email: 'Please enter a valid email address' })
      return
    }

    if (newEmail === session?.user.email) {
      setErrors({ email: 'This is already your current email' })
      return
    }

    // If no security methods are enabled, allow direct email change
    if (enabledMethodsCount === 0) {
      handleEmailChange()
      return
    }

    // Otherwise, proceed to verification step
    setStep('verify')
  }

  const handleEmailChange = async () => {
    setLoading(true)
    setErrors({})

    try {
      // If security methods are enabled, verify them first
      if (enabledMethodsCount > 0) {
        const requiredVerifications = getRequiredVerifications()
        
        for (const { method } of requiredVerifications) {
          const isValid = await verifyMethod(method)
          if (!isValid) {
            setLoading(false)
        return
          }
        }
      }

      // Update email in auth
      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail
      })

      if (updateError) throw updateError

      toast.success('Email update initiated! Please check your new email for confirmation.')
      onSuccess()
      onClose()
      setStep('email')
      setNewEmail('')
      setCodes({ totp: '', sms: '', email: '' })
      
    } catch (error) {
      console.error('Email change error:', error)
      setErrors({ general: 'Failed to update email. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setStep('email')
    setNewEmail('')
    setCodes({ totp: '', sms: '', email: '' })
    setErrors({})
    setLoading(false)
  }

  useEffect(() => {
    if (!isOpen) {
      resetModal()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Change Email Address</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {step === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Email
                </label>
                <div className="p-3 bg-gray-50 border rounded-lg">
                  <p className="text-gray-800">{session?.user.email}</p>
            </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email address"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                )}
              </div>
              
              {enabledMethodsCount === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-amber-800 text-sm font-medium">No Security Methods Enabled</p>
                      <p className="text-amber-700 text-sm mt-1">
                        Since you haven't set up any security methods, you can change your email directly. 
                        We recommend setting up authentication methods for better security.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {enabledMethodsCount > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <ShieldCheckIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-blue-800 text-sm font-medium">Security Verification Required</p>
                      <p className="text-blue-700 text-sm mt-1">
                        You'll need to verify using your enabled security methods before changing your email.
                      </p>
                    </div>
                  </div>
                </div>
              )}

                      <button
                onClick={handleEmailSubmit}
                        disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {enabledMethodsCount === 0 ? 'Change Email' : 'Continue'}
                      </button>
                </div>
              )}

          {step === 'verify' && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600">
                  Verify your identity using the following methods:
                </p>
                    </div>

              {getRequiredVerifications().map(({ method, label }) => (
                <div key={method} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      {label} Code
                    </label>
                    {(method === 'sms' || method === 'email') && (
                      <button
                        onClick={method === 'sms' ? sendSmsCode : sendEmailCode}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Send Code
                      </button>
                    )}
                  </div>
                      <input
                        type="text"
                    value={codes[method]}
                    onChange={(e) => setCodes(prev => ({ ...prev, [method]: e.target.value }))}
                    placeholder={`Enter ${label.toLowerCase()} code`}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors[method] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors[method] && (
                    <p className="text-red-600 text-sm">{errors[method]}</p>
                  )}
                </div>
              ))}

              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{errors.general}</p>
            </div>
          )}

              <div className="flex space-x-3">
            <button
                  onClick={() => setStep('email')}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Back
            </button>
            <button
                  onClick={handleEmailChange}
                  disabled={loading || getRequiredVerifications().some(({ method }) => !codes[method])}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
                  {loading ? 'Changing Email...' : 'Change Email'}
            </button>
          </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Security Setup Modals
interface TOTPSetupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function TOTPSetupModal({ isOpen, onClose, onSuccess }: TOTPSetupModalProps) {
  const supabase = useSupabaseClient()
  const session = useSession()
  const [step, setStep] = useState<'qr' | 'verify'>('qr')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      generateTOTPSecret()
    }
  }, [isOpen])

  const generateTOTPSecret = async () => {
    try {
      const response = await fetch('/api/security/totp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session?.user?.id })
      })
      
      if (response.ok) {
        const data = await response.json()
        setQrCode(data.qrCode)
        setSecret(data.secret)
      }
    } catch (error) {
      setError('Failed to generate TOTP secret')
    }
  }

  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/security/totp/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: session?.user?.id,
          token: verificationCode,
          secret: secret
        })
      })

      if (response.ok) {
        toast.success('Authenticator app enabled successfully!')
        onSuccess()
      onClose()
        resetModal()
      } else {
        setError('Invalid verification code')
      }
    } catch (error) {
      setError('Failed to verify code')
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setStep('qr')
    setVerificationCode('')
    setError('')
    setQrCode('')
    setSecret('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Setup Authenticator App</h2>
            <button onClick={() => { onClose(); resetModal(); }} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {step === 'qr' && (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              
              {qrCode && (
                <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                  <img src={qrCode} alt="TOTP QR Code" className="w-48 h-48" />
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm font-medium">Manual Entry:</p>
                <p className="text-blue-700 text-xs mt-1 break-all">{secret}</p>
              </div>
              
              <button
                onClick={() => setStep('verify')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                I've Added the Account
              </button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                Enter the 6-digit code from your authenticator app to complete setup:
              </p>
              
              <input
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                className="w-full px-4 py-3 border rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              
              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('qr')}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={verifyAndEnable}
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Enable TOTP'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface SMSSetupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  phoneNumber?: string
}

function SMSSetupModal({ isOpen, onClose, onSuccess, phoneNumber }: SMSSetupModalProps) {
  const supabase = useSupabaseClient()
  const session = useSession()
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [codeSent, setCodeSent] = useState(false)

  const sendVerificationCode = async () => {
    if (!phoneNumber) {
      setError('Phone number is required')
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: phoneNumber,
          user_id: session?.user?.id,
          action: 'security_setup'
        })
      })

      if (response.ok) {
        setCodeSent(true)
        toast.success('SMS code sent!')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to send SMS code')
      }
    } catch (error) {
      setError('Failed to send SMS code')
    } finally {
      setSending(false)
    }
  }

  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/sms/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: verificationCode,
          user_id: session?.user?.id,
          action: 'security_setup'
        })
      })

      if (response.ok) {
        toast.success('SMS verification enabled successfully!')
      onSuccess()
      onClose()
        resetModal()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Invalid verification code')
      }
    } catch (error) {
      setError('Failed to verify code')
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setVerificationCode('')
    setError('')
    setCodeSent(false)
  }

  useEffect(() => {
    if (isOpen && phoneNumber) {
      sendVerificationCode()
    }
  }, [isOpen, phoneNumber])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Setup SMS Verification</h2>
            <button onClick={() => { onClose(); resetModal(); }} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <DevicePhoneMobileIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 text-sm">
                We've sent a verification code to:
              </p>
              <p className="font-medium text-gray-800">{phoneNumber}</p>
            </div>
            
                <input
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              className="w-full px-4 py-3 border rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
            
            <div className="flex items-center justify-between text-sm">
                <button
                onClick={sendVerificationCode}
                disabled={sending}
                className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Resend Code'}
                </button>
            </div>
            
                <button
              onClick={verifyAndEnable}
              disabled={loading || verificationCode.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
              {loading ? 'Verifying...' : 'Enable SMS Verification'}
                </button>
              </div>
            </div>
                    </div>
                  </div>
  )
}

interface EmailSetupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  email?: string
}

function EmailSetupModal({ isOpen, onClose, onSuccess, email }: EmailSetupModalProps) {
  const supabase = useSupabaseClient()
  const session = useSession()
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const sendVerificationCode = async () => {
    setSending(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email || session?.user?.email || '',
        options: { shouldCreateUser: false }
      })

      if (!error) {
        toast.success('Email code sent!')
      } else {
        setError('Failed to send email code')
      }
    } catch (error) {
      setError('Failed to send email code')
    } finally {
      setSending(false)
    }
  }

  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email || session?.user?.email || '',
        token: verificationCode,
        type: 'email'
      })

      if (!error) {
        // Enable email verification in database
        const { error: dbError } = await supabase
          .from('user_security')
          .upsert(
            [{ user_id: session?.user?.id, email_enabled: true }],
            { onConflict: 'user_id' }
          )

        if (!dbError) {
          toast.success('Email verification enabled successfully!')
          onSuccess()
          onClose()
          resetModal()
        } else {
          setError('Failed to enable email verification')
        }
      } else {
        setError('Invalid verification code')
      }
    } catch (error) {
      setError('Failed to verify code')
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setVerificationCode('')
    setError('')
  }

  useEffect(() => {
    if (isOpen) {
      sendVerificationCode()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Setup Email Verification</h2>
            <button onClick={() => { onClose(); resetModal(); }} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
                </div>

          <div className="space-y-4">
            <div className="text-center">
              <AtSymbolIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 text-sm">
                We've sent a verification code to:
              </p>
              <p className="font-medium text-gray-800">{email || session?.user?.email}</p>
                  </div>
            
            <input
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              className="w-full px-4 py-3 border rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
            
            <div className="flex items-center justify-between text-sm">
                <button
                onClick={sendVerificationCode}
                disabled={sending}
                className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Resend Code'}
                </button>
            </div>
            
                <button
              onClick={verifyAndEnable}
              disabled={loading || verificationCode.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Enable Email Verification'}
                </button>
              </div>
        </div>
      </div>
    </div>
  )
}

export default function SecurityPage() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [sec, setSec] = useState<{
    totp_enabled: boolean
    sms_enabled: boolean
    email_enabled: boolean
  } | null>(null)
  
  // Modal states
  const [emailChangeModalOpen, setEmailChangeModalOpen] = useState(false)
  const [phoneChangeModalOpen, setPhoneChangeModalOpen] = useState(false)
  const [passwordChangeModalOpen, setPasswordChangeModalOpen] = useState(false)
  const [totpSetupModalOpen, setTotpSetupModalOpen] = useState(false)
  const [smsSetupModalOpen, setSmsSetupModalOpen] = useState(false)
  const [emailSetupModalOpen, setEmailSetupModalOpen] = useState(false)
  
  // Security Guard states
  const [securityGuardOpen, setSecurityGuardOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    type: 'disable_totp' | 'disable_sms' | 'disable_email' | 'password_change' | 'phone_change' | 'email_change' | 'enable_totp' | 'enable_sms' | 'enable_email'
    data?: any
  } | null>(null)
  
  const [userProfile, setUserProfile] = useState<{
    phone_number?: string
  } | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (session === null) {
      router.replace(`/auth/login?redirectTo=${encodeURIComponent('/user/security')}`)
    }
  }, [session, router])

  // Fetch user security settings and profile
  const fetchUserSecurity = async () => {
    if (!session?.user?.id) return
    
    try {
      // Fetch security settings
      const { data: secData, error: secError } = await supabase
        .from('user_security')
        .select('totp_enabled, sms_enabled, email_enabled')
        .eq('user_id', session.user.id)
        .single()

      if (secError && secError.code === 'PGRST116') {
        // No record found, return defaults
        setSec({ totp_enabled: false, sms_enabled: false, email_enabled: false })
      } else if (secError) {
        throw secError
      } else {
        setSec({
          totp_enabled: secData.totp_enabled,
          sms_enabled: secData.sms_enabled,
          email_enabled: secData.email_enabled,
        })
      }

      // Fetch user profile for phone number
      const { data: profileData, error: profileError } = await supabase
        .from('user_profile')
        .select('phone_number')
        .eq('uid', session.user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError)
      } else if (profileData) {
        setUserProfile(profileData)
      }
      
    } catch (error) {
      console.error('Error fetching security settings:', error)
      setSec({ totp_enabled: false, sms_enabled: false, email_enabled: false })
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserSecurity()
    }
  }, [session?.user?.id])

  const reloadSecurity = () => {
    fetchUserSecurity()
  }

  // Local implementation of setSecurityMethods using session provider's client
  const updateSecurityMethods = async (params: {
    sms_enabled?: boolean
    email_enabled?: boolean
    totp_enabled?: boolean
    totp_factor_sid?: string
    totp_secret?: string
  }) => {
    if (!session?.user?.id) throw new Error('No user session')
    
    const { error } = await supabase
      .from('user_security')
      .upsert(
        [{ user_id: session.user.id, ...params }],
        { onConflict: 'user_id' }
      )
    if (error) throw error
  }

  // Security verification handlers
  const requireSecurityVerification = (actionType: string, actionData?: any) => {
    setPendingAction({ type: actionType as any, data: actionData })
    setSecurityGuardOpen(true)
  }

  const executeSecuredAction = async () => {
    if (!pendingAction) return

    try {
      switch (pendingAction.type) {
        case 'disable_totp':
          await updateSecurityMethods({ totp_enabled: false })
          setSec(s => s && { ...s, totp_enabled: false })
          toast.success('Authenticator app disabled')
          break
          
        case 'disable_sms':
          await updateSecurityMethods({ sms_enabled: false })
          setSec(s => s && { ...s, sms_enabled: false })
          toast.success('SMS verification disabled')
          break
          
        case 'disable_email':
          await updateSecurityMethods({ email_enabled: false })
          setSec(s => s && { ...s, email_enabled: false })
          toast.success('Email verification disabled')
          break

        case 'enable_totp':
          setTotpSetupModalOpen(true)
          break

        case 'enable_sms':
          if (!userProfile?.phone_number) {
            toast.error('Please add a phone number first')
            return
          }
          setSmsSetupModalOpen(true)
          break

        case 'enable_email':
          setEmailSetupModalOpen(true)
          break
          
        case 'password_change':
          setPasswordChangeModalOpen(true)
          break
          
        case 'phone_change':
          setPhoneChangeModalOpen(true)
          break
          
        case 'email_change':
          setEmailChangeModalOpen(true)
          break
      }
    } catch (error) {
      console.error('Security action error:', error)
      toast.error('Failed to complete security action')
    } finally {
      setPendingAction(null)
    }
  }

  // Security method handlers
  const handleEnableTOTP = () => {
    // Check if any security methods are enabled
    const enabledMethodsCount = [sec?.totp_enabled, sec?.sms_enabled, sec?.email_enabled].filter(Boolean).length
    
    if (enabledMethodsCount === 0) {
      // No security methods enabled, allow direct setup
      setTotpSetupModalOpen(true)
    } else {
      // Require security verification
      requireSecurityVerification('enable_totp')
    }
  }

  const handleDisableTOTP = () => {
    requireSecurityVerification('disable_totp')
  }

  const handleEnableSMS = () => {
    if (!userProfile?.phone_number) {
      toast.error('Please add a phone number first')
      return
    }

    // Check if any security methods are enabled
    const enabledMethodsCount = [sec?.totp_enabled, sec?.sms_enabled, sec?.email_enabled].filter(Boolean).length
    
    if (enabledMethodsCount === 0) {
      // No security methods enabled, allow direct setup
      setSmsSetupModalOpen(true)
    } else {
      // Require security verification
      requireSecurityVerification('enable_sms')
    }
  }

  const handleDisableSMS = () => {
    requireSecurityVerification('disable_sms')
  }

  const handleEnableEmail = () => {
    // Check if any security methods are enabled
    const enabledMethodsCount = [sec?.totp_enabled, sec?.sms_enabled, sec?.email_enabled].filter(Boolean).length
    
    if (enabledMethodsCount === 0) {
      // No security methods enabled, allow direct setup
      setEmailSetupModalOpen(true)
    } else {
      // Require security verification
      requireSecurityVerification('enable_email')
    }
  }

  const handleDisableEmail = () => {
    requireSecurityVerification('disable_email')
  }

  // Credential change handlers with security verification
  const handlePasswordChange = () => {
    requireSecurityVerification('password_change')
  }

  const handlePhoneChange = () => {
    requireSecurityVerification('phone_change')
  }

  const handleEmailChange = () => {
    requireSecurityVerification('email_change')
  }

  if (session === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!session) return null
  if (!sec) return <p>Loading security settings…</p>

  return (
    <>
      {/* Security Guard */}
      <SecurityGuard
        isOpen={securityGuardOpen}
        onClose={() => {
          setSecurityGuardOpen(false)
          setPendingAction(null)
        }}
        onSuccess={executeSecuredAction}
        title="Security Verification Required"
        description="Please verify your identity to proceed with this security action."
        requireMinimumMethods={
          pendingAction?.type?.startsWith('enable_') ? 0 : 1
        }
      >
        <div></div>
      </SecurityGuard>

      <div className="p-6 space-y-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
          <div className="text-sm text-gray-500">
            Secure your account with multiple verification methods
          </div>
        </div>

        {/* Account Credentials Section */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Account Credentials</h2>
            <p className="text-sm text-gray-600 mt-1">Manage your login credentials</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {/* Email Management */}
            <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <AtSymbolIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                    <h3 className="text-lg font-semibold text-gray-800">Email Address</h3>
                    <p className="text-gray-600">Change your primary email address</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Current: {session?.user.email}
                    </p>
              </div>
            </div>
                  <button
                  onClick={handleEmailChange}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                  Change Email
                  </button>
              </div>
            </div>

            {/* Password Management */}
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <LockClosedIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Password</h3>
                    <p className="text-gray-600">Update your account password</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Last changed: Unknown
                    </p>
                  </div>
                </div>
                  <button
                  onClick={handlePasswordChange}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                  Change Password
                  </button>
          </div>
        </div>

            {/* Phone Number Management */}
            <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <DevicePhoneMobileIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                    <h3 className="text-lg font-semibold text-gray-800">Phone Number</h3>
                    <p className="text-gray-600">Update your phone number for SMS verification</p>
                  <p className="text-sm text-gray-500 mt-1">
                      Current: {userProfile?.phone_number || 'Not set'}
                    </p>
              </div>
            </div>
                <button
                  onClick={handlePhoneChange}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {userProfile?.phone_number ? 'Change Phone' : 'Add Phone'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication Section */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Two-Factor Authentication</h2>
            <p className="text-sm text-gray-600 mt-1">Add extra security layers to your account</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {/* Authenticator App (TOTP) */}
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <KeyIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Authenticator App (TOTP)</h3>
                    <p className="text-gray-600">Use Google Authenticator, Authy, or similar apps</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Generate time-based verification codes
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {sec.totp_enabled ? (
                <>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Enabled
                  </span>
                      <Link href="/user/security/Authenticator">
                        <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                          <CogIcon className="h-4 w-4" />
                  </button>
                      </Link>
                  <button
                        onClick={handleDisableTOTP}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                        <TrashIcon className="h-4 w-4" />
                  </button>
                </>
                  ) : (
                    <button
                      onClick={handleEnableTOTP}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Enable
                    </button>
              )}
            </div>
          </div>
        </div>

            {/* SMS OTP */}
            <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <DevicePhoneMobileIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                    <h3 className="text-lg font-semibold text-gray-800">SMS Verification</h3>
                    <p className="text-gray-600">Receive verification codes via SMS</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Requires a verified phone number
                    </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
                  {sec.sms_enabled ? (
                <>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Enabled
                  </span>
                  <button
                        onClick={handleDisableSMS}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                  </button>
                </>
              ) : (
                    <button
                      onClick={handleEnableSMS}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Enable
                    </button>
              )}
            </div>
          </div>
        </div>

            {/* Email OTP */}
            <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                  <div className="p-3 bg-teal-100 rounded-lg">
                    <AtSymbolIcon className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                    <h3 className="text-lg font-semibold text-gray-800">Email Verification</h3>
                    <p className="text-gray-600">Receive verification codes via email</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Uses your registered email address
                    </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
                  {sec.email_enabled ? (
                    <>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Enabled
                      </span>
                      <button
                        onClick={handleDisableEmail}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEnableEmail}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      Enable
                    </button>
                  )}
            </div>
          </div>
        </div>
            </div>
                </div>
                
        {/* Security Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <ShieldCheckIcon className="h-8 w-8 text-blue-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Security Status</h3>
              <p className="text-blue-700 mt-1">
                You have {[sec.totp_enabled, sec.sms_enabled, sec.email_enabled].filter(Boolean).length} 
                {' '}of 3 security methods enabled.
              </p>
              <div className="mt-3 text-sm text-blue-600">
                <p>• We recommend enabling at least 2 security methods</p>
                <p>• Authenticator apps provide the highest security</p>
                <p>• Always keep your credentials secure and up to date</p>
                {[sec.totp_enabled, sec.sms_enabled, sec.email_enabled].filter(Boolean).length === 0 ? (
                  <p className="mt-2 text-amber-700 font-medium">
                    💡 Your first security method can be enabled directly. Additional methods will require verification.
                  </p>
                ) : (
                  <p className="mt-2 text-green-700 font-medium">
                    🔒 All security changes now require verification using your enabled methods.
                  </p>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Setup Modals */}
      <TOTPSetupModal
        isOpen={totpSetupModalOpen}
        onClose={() => setTotpSetupModalOpen(false)}
        onSuccess={() => {
          setSec(s => s && { ...s, totp_enabled: true })
          reloadSecurity()
        }}
      />
      
      <SMSSetupModal
        isOpen={smsSetupModalOpen}
        onClose={() => setSmsSetupModalOpen(false)}
        phoneNumber={userProfile?.phone_number}
        onSuccess={() => {
          setSec(s => s && { ...s, sms_enabled: true })
          reloadSecurity()
        }}
      />
      
      <EmailSetupModal
        isOpen={emailSetupModalOpen}
        onClose={() => setEmailSetupModalOpen(false)}
        email={session?.user?.email}
        onSuccess={() => {
          setSec(s => s && { ...s, email_enabled: true })
          reloadSecurity()
        }}
      />

      {/* Credential Change Modals - Only open after security verification */}
      <EmailChangeModal
        isOpen={emailChangeModalOpen}
        onClose={() => setEmailChangeModalOpen(false)}
        currentSecurity={sec}
        onSuccess={reloadSecurity}
      />
      
      <PhoneChangeModal
        open={phoneChangeModalOpen}
        onClose={() => setPhoneChangeModalOpen(false)}
        onSuccess={(newPhone) => {
          setUserProfile(prev => ({ ...prev, phone_number: newPhone }))
          toast.success('Phone number updated successfully')
        }}
      />
      
      <PasswordChangeModal
        open={passwordChangeModalOpen}
        onClose={() => setPasswordChangeModalOpen(false)}
        onSuccess={() => {
          toast.success('Password updated successfully')
        }}
      />
    </>
  )
}
