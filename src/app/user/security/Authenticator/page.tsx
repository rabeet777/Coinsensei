'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'react-qr-code'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  KeyIcon, 
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'

export default function AuthenticatorPage() {
  const router = useRouter()
  const supabase = useSupabaseClient()
  const session = useSession()

  const [step, setStep] = useState<'setup' | 'verify' | 'success'>('setup')
  const [uri, setUri] = useState<string>('')
  const [secret, setSecret] = useState<string>('')
  const [factorSid, setFactorSid] = useState<string>('')
  const [token, setToken] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [isAlreadyEnabled, setIsAlreadyEnabled] = useState(false)

  // Check if TOTP is already enabled
  useEffect(() => {
    if (!session?.user?.id) return

    const checkExistingTotp = async () => {
      try {
        const { data, error } = await supabase
          .from('user_security')
          .select('totp_enabled')
          .eq('user_id', session.user.id)
          .single()

        if (!error && data?.totp_enabled) {
          setIsAlreadyEnabled(true)
        }
      } catch (err) {
        console.error('Error checking TOTP status:', err)
      }
    }

    checkExistingTotp()
  }, [session, supabase])

  // Generate TOTP factor
  const handleSetup = async () => {
    if (!session?.user?.id) {
      setError('Not authenticated. Please log in again.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/security/setup-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity: session.user.id,
          friendlyName: session.user.email || session.user.id,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to setup TOTP')
      }

      setFactorSid(data.factorSid)
      setUri(data.uri)
      setSecret(data.secret)
      setStep('verify')
      setTimeout(() => toast.success('QR code generated! Scan with your authenticator app.'), 0)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to setup TOTP'
      setError(errorMessage)
      setTimeout(() => toast.error('Failed to generate QR code'), 0)
    } finally {
      setLoading(false)
    }
  }

  // Verify TOTP code
  const handleVerify = async () => {
    if (!factorSid) {
      setError('Setup incomplete. Please generate a new QR code.')
      return
    }

    if (!/^[0-9]{6}$/.test(token)) {
      setError('Please enter a valid 6-digit code.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/security/verify-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identity: session!.user.id, 
          factorSid, 
          authPayload: token, 
          secret 
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.verified) {
        throw new Error(data.error || 'Verification failed')
      }

      // Save to database
      const { error: dbError } = await supabase
        .from('user_security')
        .upsert([{ 
          user_id: session!.user.id, 
            totp_enabled: true,
            totp_factor_sid: factorSid,
            totp_secret: secret
        }], { onConflict: 'user_id' })

      if (dbError) {
        throw new Error(`Failed to save security settings: ${dbError.message}`)
      }

      setStep('success')
      setTimeout(() => toast.success('Authenticator app setup completed!'), 0)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed'
      setError(errorMessage)
      setTimeout(() => toast.error('Invalid code. Please try again.'), 0)
    } finally {
      setLoading(false)
    }
  }

  const copySecret = () => {
    navigator.clipboard.writeText(secret)
    setTimeout(() => toast.success('Secret copied to clipboard!'), 0)
  }

  const resetSetup = () => {
    setStep('setup')
    setUri('')
    setSecret('')
    setFactorSid('')
    setToken('')
    setError('')
  }

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to set up two-factor authentication.</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
      <button
              onClick={() => router.push('/user/security')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
      </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Authenticator App Setup
              </h1>
              <p className="text-gray-600 mt-1">Set up two-factor authentication using Google Authenticator or similar apps</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Already Enabled Warning */}
        {isAlreadyEnabled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-orange-800">TOTP Already Enabled</h3>
                  <p className="text-orange-700 text-sm">
                    You already have authenticator app enabled. Setting up a new one will replace your current configuration.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* Setup Step */}
          {step === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="text-center mb-8">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <KeyIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Set Up Authenticator App</h2>
                <p className="text-gray-600">
                  Add an extra layer of security to your account with two-factor authentication
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">📱 Recommended Apps:</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Google Authenticator</li>
                  <li>• Microsoft Authenticator</li>
                  <li>• Authy</li>
                  <li>• LastPass Authenticator</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleSetup}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating QR Code...' : 'Generate QR Code'}
              </button>
            </motion.div>
          )}

          {/* Verify Step */}
          {step === 'verify' && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="text-center mb-8">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <KeyIcon className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Scan QR Code</h2>
                <p className="text-gray-600">
                  Scan this QR code with your authenticator app, then enter the 6-digit code
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* QR Code */}
                <div className="text-center">
                  <div className="bg-white p-6 rounded-xl border-2 border-gray-200 inline-block mb-4">
                    <QRCode value={uri} size={200} />
                  </div>
                  <p className="text-sm text-gray-500">Scan with your authenticator app</p>
                </div>

                {/* Manual Entry */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Can't scan? Enter manually:</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Secret Key:</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowSecret(!showSecret)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title={showSecret ? "Hide" : "Show"}
                          >
                            {showSecret ? 
                              <EyeSlashIcon className="h-4 w-4 text-gray-600" /> : 
                              <EyeIcon className="h-4 w-4 text-gray-600" />
                            }
                          </button>
                          <button
                            onClick={copySecret}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Copy"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                      <code className="text-sm font-mono break-all">
                        {showSecret ? secret : '••••••••••••••••••••••••••••••••'}
                      </code>
                    </div>
                  </div>

                  {/* Verification */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter 6-digit code from your app:
                    </label>
            <input
              type="text"
              placeholder="123456"
              value={token}
              maxLength={6}
                      onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="space-y-3">
            <button
              onClick={handleVerify}
                      disabled={loading || token.length !== 6}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                    
                    <button
                      onClick={resetSetup}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
                    >
                      Generate New QR Code
            </button>
          </div>
        </div>
              </div>
            </motion.div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl p-8 text-center"
            >
              <div className="mb-8">
                <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="h-12 w-12 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Setup Complete!</h2>
                <p className="text-gray-600 text-lg">
                  Your authenticator app has been successfully configured
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-green-800 mb-2">🔐 Your Account is Now More Secure</h3>
                <p className="text-green-700 text-sm">
                  Two-factor authentication is now active. You'll be asked for a code from your authenticator app 
                  when logging in and performing sensitive operations.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => router.push('/user/security')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
                >
                  Back to Security Settings
                </button>
                
                <button
                  onClick={() => router.push('/user/dashboard')}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
