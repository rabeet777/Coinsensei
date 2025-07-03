'use client'

import { useState, useEffect, ReactNode, useCallback } from 'react'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheckIcon, 
  KeyIcon, 
  DevicePhoneMobileIcon, 
  EnvelopeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CameraIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'

interface SecurityMethods {
  totp_enabled: boolean
  sms_enabled: boolean
  email_enabled: boolean
}

interface SecurityGuardProps {
  children: ReactNode
  title?: string
  description?: string
  onSuccess?: () => void
  onCancel?: () => void
  requireMinimumMethods?: number
  isOpen: boolean
  onClose: () => void
}

interface VerificationMethod {
  id: 'totp' | 'sms' | 'email'
  name: string
  icon: any
  color: string
  enabled: boolean
  selected: boolean
  verified: boolean
  loading: boolean
  code: string
}

export default function SecurityGuard({ 
  children,
  title = "Security Verification Required",
  description = "Choose at least one verification method to proceed.",
  onSuccess,
  onCancel,
  requireMinimumMethods = 1,
  isOpen,
  onClose
}: SecurityGuardProps) {
  const session = useSession()
  const supabase = useSupabaseClient()

  const [securityMethods, setSecurityMethods] = useState<SecurityMethods | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'check' | 'select' | 'verify' | 'success' | 'recovery' | 'live-verification'>('check')
  
  // Verification methods state
  const [verificationMethods, setVerificationMethods] = useState<VerificationMethod[]>([])
  
  // Recovery states
  const [liveVerificationStep, setLiveVerificationStep] = useState<'instructions' | 'capture' | 'processing' | 'submitted'>('instructions')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [recoveryReason, setRecoveryReason] = useState('')
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
  
  const [error, setError] = useState<string | null>(null)

  // Initialize verification methods
  const initializeVerificationMethods = useCallback((secMethods: SecurityMethods) => {
    const methods: VerificationMethod[] = [
      {
        id: 'totp',
        name: 'Authenticator App',
        icon: KeyIcon,
        color: 'blue',
        enabled: secMethods.totp_enabled,
        selected: false,
        verified: false,
        loading: false,
        code: ''
      },
      {
        id: 'sms',
        name: 'SMS Verification',
        icon: DevicePhoneMobileIcon,
        color: 'green',
        enabled: secMethods.sms_enabled,
        selected: false,
        verified: false,
        loading: false,
        code: ''
      },
      {
        id: 'email',
        name: 'Email Verification',
        icon: EnvelopeIcon,
        color: 'purple',
        enabled: secMethods.email_enabled,
        selected: false,
        verified: false,
        loading: false,
        code: ''
      }
    ]
    setVerificationMethods(methods.filter(m => m.enabled))
  }, [])

  // Load security methods
  const loadSecurityMethods = useCallback(async () => {
    if (!session?.user?.id) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_security')
        .select('totp_enabled, sms_enabled, email_enabled')
        .eq('user_id', session.user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        const defaultMethods = { totp_enabled: false, sms_enabled: false, email_enabled: false }
        setSecurityMethods(defaultMethods)
        initializeVerificationMethods(defaultMethods)
      } else if (error) {
        throw error
      } else {
        setSecurityMethods(data)
        initializeVerificationMethods(data)
      }
    } catch (err) {
      console.error('Error loading security methods:', err)
      setError('Failed to load security settings')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, supabase, initializeVerificationMethods])

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('check')
      setError(null)
      setLiveVerificationStep('instructions')
      setCapturedImage(null)
      setRecoveryReason('')
      loadSecurityMethods()
    } else {
      // Clean up video stream when modal closes
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop())
        setVideoStream(null)
      }
      
      // Also clean up any video elements
      const videoElement = document.getElementById('live-video') as HTMLVideoElement
      if (videoElement) {
        videoElement.srcObject = null
      }
    }
  }, [isOpen])

  // Separate effect to load security methods when session changes
  useEffect(() => {
    if (isOpen && session?.user?.id) {
      loadSecurityMethods()
    }
  }, [session?.user?.id, isOpen, loadSecurityMethods])

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [videoStream])

  // Check if user has enough security methods
  const enabledMethodsCount = securityMethods 
    ? (securityMethods.totp_enabled ? 1 : 0) + 
      (securityMethods.sms_enabled ? 1 : 0) + 
      (securityMethods.email_enabled ? 1 : 0)
    : 0

  const hasEnoughMethods = enabledMethodsCount >= requireMinimumMethods

  // Check selected methods count
  const selectedMethodsCount = verificationMethods.filter(m => m.selected).length
  const verifiedMethodsCount = verificationMethods.filter(m => m.selected && m.verified).length
  const canProceed = selectedMethodsCount >= 1 && verifiedMethodsCount >= 1

  // Toggle method selection
  const toggleMethodSelection = (methodId: string) => {
    setVerificationMethods(prev => 
      prev.map(method => 
        method.id === methodId 
          ? { ...method, selected: !method.selected, verified: false, code: '' }
          : method
      )
    )
  }

  // Update method code
  const updateMethodCode = (methodId: string, code: string) => {
    setVerificationMethods(prev => 
      prev.map(method => 
        method.id === methodId 
          ? { ...method, code: code.replace(/\D/g, '') }
          : method
      )
    )
  }

  // Set method loading state
  const setMethodLoading = (methodId: string, loading: boolean) => {
    setVerificationMethods(prev => 
      prev.map(method => 
        method.id === methodId 
          ? { ...method, loading }
          : method
      )
    )
  }

  // Set method verified state
  const setMethodVerified = (methodId: string, verified: boolean) => {
    setVerificationMethods(prev => 
      prev.map(method => 
        method.id === methodId 
          ? { ...method, verified, code: verified ? '' : method.code }
          : method
      )
    )
  }

  // Send SMS code
  const sendSmsCode = async () => {
    setMethodLoading('sms', true)
    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: session?.user?.phone || '' })
      })
      if (!res.ok) throw new Error('Failed to send SMS')
      toast.success('SMS code sent')
    } catch (err) {
      setError('Failed to send SMS code')
    } finally {
      setMethodLoading('sms', false)
    }
  }

  // Send email code
  const sendEmailCode = async () => {
    setMethodLoading('email', true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: session?.user?.email || '',
        options: { shouldCreateUser: false }
      })
      if (error) throw error
      toast.success('Email code sent')
    } catch (err) {
      setError('Failed to send email code')
    } finally {
      setMethodLoading('email', false)
    }
  }

  // Verify method
  const verifyMethod = async (method: VerificationMethod) => {
    if (!method.code || method.code.length !== 6) return
    
    setMethodLoading(method.id, true)
    setError(null)
    
    try {
      let success = false
      
      switch (method.id) {
        case 'totp':
          const totpRes = await fetch('/api/security/verify-totp-withdrawal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: method.code })
          })
          success = totpRes.ok
          break
          
        case 'sms':
          const smsRes = await fetch('/api/sms/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: method.code, userId: session?.user?.id })
          })
          success = smsRes.ok
          break
          
        case 'email':
          const { error } = await supabase.auth.verifyOtp({
            email: session?.user?.email || '',
            token: method.code,
            type: 'email'
          })
          success = !error
          break
      }
      
      if (success) {
        setMethodVerified(method.id, true)
        toast.success(`${method.name} verified`)
      } else {
        throw new Error('Invalid verification code')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid verification code'
      setError(errorMessage)
    } finally {
      setMethodLoading(method.id, false)
    }
  }

  // Start live verification
  const startLiveVerification = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      })
      setVideoStream(stream)
      setLiveVerificationStep('capture')
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions.')
    }
  }

  // Capture photo for live verification
  const capturePhoto = () => {
    if (!videoStream) return
    
    const video = document.getElementById('live-video') as HTMLVideoElement
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(video, 0, 0)
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8)
    setCapturedImage(imageData)
    setLiveVerificationStep('processing')
    
    // Stop video stream
    videoStream.getTracks().forEach(track => track.stop())
    setVideoStream(null)
  }

  // Submit recovery request
  const submitRecoveryRequest = async () => {
    if (!capturedImage || !recoveryReason.trim()) {
      setError('Please complete live verification and provide a reason')
      return
    }

    try {
      const response = await fetch('/api/security/recovery/submit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'lost_access',
          reason: recoveryReason,
          livePhoto: capturedImage,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) throw new Error('Failed to submit recovery request')

      setLiveVerificationStep('submitted')
      toast.success('Recovery request submitted for admin review')
    } catch (err) {
      setError('Failed to submit recovery request')
    }
  }

  // Handle proceed
  const handleProceed = () => {
    if (canProceed) {
      setStep('success')
      if (onSuccess) {
        onSuccess()
      }
      setTimeout(() => {
        onClose()
      }, 1500)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    onClose()
  }

  if (!isOpen) return children

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Checking security settings...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <AnimatePresence mode="wait">
        {/* Security Check Step */}
        {step === 'check' && !hasEnoughMethods && (
          <motion.div
            key="insufficient"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
          >
            <div className="text-center mb-6">
              <ExclamationTriangleIcon className="h-16 w-16 text-orange-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Additional Security Required</h2>
              <p className="text-gray-600">
                You need at least {requireMinimumMethods} security method{requireMinimumMethods > 1 ? 's' : ''} enabled to perform this action.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => window.open('/user/security', '_blank')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Setup Security Methods
              </button>
              <button
                onClick={handleCancel}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* Method Selection Step */}
        {(step === 'check' && hasEnoughMethods || step === 'select') && (
          <motion.div
            key="select"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
            onAnimationComplete={() => {
              if (step === 'check' && hasEnoughMethods) {
                setStep('select')
              }
            }}
          >
            <div className="text-center mb-6">
              <ShieldCheckIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
              <p className="text-gray-600">{description}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500 text-center">
                Select at least {requireMinimumMethods} verification method{requireMinimumMethods > 1 ? 's' : ''} to proceed:
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {verificationMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => toggleMethodSelection(method.id)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    method.selected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <method.icon className={`h-6 w-6 ${method.selected ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className={`font-medium ${method.selected ? 'text-blue-800' : 'text-gray-700'}`}>
                        {method.name}
                      </span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      method.selected 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {method.selected && (
                        <CheckCircleIcon className="w-3 h-3 text-white m-0.5" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('verify')}
                disabled={selectedMethodsCount < 1}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                Continue ({selectedMethodsCount} selected)
              </button>
            </div>

            {/* Account Recovery Link */}
            <div className="mt-4 text-center">
              <button
                onClick={() => setStep('recovery')}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Can't access your security methods?
              </button>
            </div>
          </motion.div>
        )}

        {/* Verification Step */}
        {step === 'verify' && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
          >
            <div className="text-center mb-6">
              <ShieldCheckIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Identity</h2>
              <p className="text-gray-600">
                Complete verification for your selected methods:
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              {verificationMethods
                .filter(method => method.selected)
                .map((method) => (
                <div key={method.id} className={`border-2 rounded-lg p-4 ${method.verified ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <method.icon className="h-5 w-5 text-gray-600" />
                      <span className="font-medium">{method.name}</span>
                    </div>
                    {method.verified && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
                  </div>
                  
                  {!method.verified && (
                    <div className="space-y-2">
                      {(method.id === 'sms' || method.id === 'email') && (
                        <button
                          onClick={method.id === 'sms' ? sendSmsCode : sendEmailCode}
                          disabled={method.loading}
                          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 mb-2"
                        >
                          {method.loading ? 'Sending...' : `Send ${method.id === 'sms' ? 'SMS' : 'Email'} Code`}
                        </button>
                      )}
                      <input
                        type="text"
                        placeholder={`Enter ${method.id === 'totp' ? '6-digit' : method.id.toUpperCase()} code`}
                        value={method.code}
                        onChange={(e) => updateMethodCode(method.id, e.target.value)}
                        maxLength={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={() => verifyMethod(method)}
                        disabled={method.loading || method.code.length !== 6}
                        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {method.loading ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep('select')}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleProceed}
                disabled={!canProceed}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                Proceed ({verifiedMethodsCount} verified)
              </button>
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
            className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
          >
            <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Complete!</h2>
            <p className="text-gray-600">Your identity has been verified successfully.</p>
          </motion.div>
        )}

        {/* Account Recovery Step */}
        {step === 'recovery' && (
          <motion.div
            key="recovery"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
          >
            <div className="text-center mb-6">
              <ExclamationTriangleIcon className="h-16 w-16 text-orange-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Recovery</h2>
              <p className="text-gray-600">
                If you've lost access to your security methods, you can request a complete reset:
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-red-800 mb-2">⚠️ Complete Security Reset</h3>
              <p className="text-sm text-red-700">
                This will disable ALL your current security methods after admin approval. 
                You'll need to set them up again from scratch.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setStep('live-verification')}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CameraIcon className="h-5 w-5" />
                Start Live Verification
              </button>
              
              <div className="text-center">
                <button
                  onClick={() => setStep('select')}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Back to verification methods
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Live Verification Step */}
        {step === 'live-verification' && (
          <motion.div
            key="live-verification"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full"
          >
            {liveVerificationStep === 'instructions' && (
              <>
                <div className="text-center mb-6">
                  <CameraIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Live Identity Verification</h2>
                  <p className="text-gray-600">
                    We need to verify your identity through live photo capture
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Ensure good lighting on your face</li>
                    <li>• Look directly at the camera</li>
                    <li>• Remove sunglasses or face coverings</li>
                    <li>• Stay still during capture</li>
                  </ul>
                </div>

                <textarea
                  placeholder="Please explain why you need to reset your security methods..."
                  value={recoveryReason}
                  onChange={(e) => setRecoveryReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                  rows={3}
                />

                <div className="flex space-x-3">
                  <button
                    onClick={() => setStep('recovery')}
                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={startLiveVerification}
                    disabled={!recoveryReason.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Start Camera
                  </button>
                </div>
              </>
            )}

            {liveVerificationStep === 'capture' && (
              <>
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Position Your Face</h2>
                  <p className="text-gray-600">Click capture when ready</p>
                </div>

                <div className="relative mb-4">
                  <video
                    id="live-video"
                    ref={(video) => {
                      if (video && videoStream) {
                        video.srcObject = videoStream
                        video.play().catch((error) => {
                          // Ignore play() errors when video is removed from DOM
                          if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
                            console.warn('Video play error:', error)
                          }
                        })
                      }
                    }}
                    className="w-full h-64 object-cover rounded-lg bg-gray-100"
                    autoPlay
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 border-4 border-blue-500 rounded-lg pointer-events-none"></div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      // Properly cleanup video before changing state
                      const videoElement = document.getElementById('live-video') as HTMLVideoElement
                      if (videoElement) {
                        videoElement.srcObject = null
                      }
                      
                      videoStream?.getTracks().forEach(track => track.stop())
                      setVideoStream(null)
                      setLiveVerificationStep('instructions')
                    }}
                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Capture Photo
                  </button>
                </div>
              </>
            )}

            {liveVerificationStep === 'processing' && (
              <>
                <div className="text-center mb-6">
                  <UserIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-800">Review & Submit</h2>
                  <p className="text-gray-600">Please review your captured photo</p>
                </div>

                {capturedImage && (
                  <div className="mb-4">
                    <img 
                      src={capturedImage} 
                      alt="Captured verification" 
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Reason:</strong> {recoveryReason}
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setLiveVerificationStep('instructions')}
                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Retake
                  </button>
                  <button
                    onClick={submitRecoveryRequest}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Submit Request
                  </button>
                </div>
              </>
            )}

            {liveVerificationStep === 'submitted' && (
              <>
                <div className="text-center mb-6">
                  <ClockIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-800">Request Submitted</h2>
                  <p className="text-gray-600">
                    Your recovery request has been submitted for admin review
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-800 mb-2">What happens next:</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Admin will review your identity verification</li>
                    <li>• You'll receive an email notification about the decision</li>
                    <li>• If approved, all security methods will be reset</li>
                    <li>• You can then set up new security methods</li>
                  </ul>
                </div>

                <button
                  onClick={onClose}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Close
                </button>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 