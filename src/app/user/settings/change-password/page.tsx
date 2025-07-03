'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { motion } from 'framer-motion'
import { 
  ArrowLeftIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import SecurityGuard from '@/components/SecurityGuard'

interface PasswordStrength {
  score: number
  feedback: string[]
  requirements: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    number: boolean
    special: boolean
  }
}

export default function ChangePasswordPage() {
  const router = useRouter()
  const session = useSession()
  const supabase = useSupabaseClient()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [securityGuardOpen, setSecurityGuardOpen] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (session === null) {
      router.replace('/auth/login?redirectTo=' + encodeURIComponent('/user/settings/change-password'))
    }
  }, [session, router])

  // Password strength checker
  const checkPasswordStrength = (password: string): PasswordStrength => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }

    const metRequirements = Object.values(requirements).filter(Boolean).length
    let score = 0
    const feedback: string[] = []

    if (metRequirements === 5 && password.length >= 12) {
      score = 4 // Very Strong
    } else if (metRequirements >= 4 && password.length >= 8) {
      score = 3 // Strong
    } else if (metRequirements >= 3) {
      score = 2 // Medium
    } else if (metRequirements >= 2) {
      score = 1 // Weak
    } else {
      score = 0 // Very Weak
    }

    if (!requirements.length) feedback.push('At least 8 characters')
    if (!requirements.uppercase) feedback.push('One uppercase letter')
    if (!requirements.lowercase) feedback.push('One lowercase letter')
    if (!requirements.number) feedback.push('One number')
    if (!requirements.special) feedback.push('One special character')

    return { score, feedback, requirements }
  }

  const passwordStrength = checkPasswordStrength(newPassword)
  const isStrongPassword = passwordStrength.score >= 3
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword

  // Validate current password
  const validateCurrentPassword = async () => {
    if (!currentPassword) {
      setError('Please enter your current password')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Test current password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: session?.user?.email || '',
        password: currentPassword
      })

      if (authError) {
        throw new Error('Current password is incorrect')
      }

      setSecurityGuardOpen(true)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Current password verification failed'
      setError(errorMessage)
      setTimeout(() => toast.error('Current password verification failed'), 0)
    } finally {
      setLoading(false)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isStrongPassword) {
      setError('Please create a stronger password')
      return
    }

    if (!passwordsMatch) {
      setError('Passwords do not match')
      return
    }

    validateCurrentPassword()
  }

  // Complete password change after security verification
  const completePasswordChange = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        throw new Error(error.message)
      }

      setSuccess(true)
      setTimeout(() => toast.success('Password changed successfully!'), 0)
      
      // Reset form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      // Redirect after success
      setTimeout(() => {
        router.push('/user/security')
      }, 2000)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password'
      setError(errorMessage)
      setTimeout(() => toast.error('Failed to change password'), 0)
    } finally {
      setLoading(false)
    }
  }

  const getStrengthColor = (score: number) => {
    switch (score) {
      case 0: return 'bg-red-500'
      case 1: return 'bg-orange-500'
      case 2: return 'bg-yellow-500'
      case 3: return 'bg-blue-500'
      case 4: return 'bg-green-500'
      default: return 'bg-gray-300'
    }
  }

  const getStrengthText = (score: number) => {
    switch (score) {
      case 0: return 'Very Weak'
      case 1: return 'Weak'
      case 2: return 'Medium'
      case 3: return 'Strong'
      case 4: return 'Very Strong'
      default: return 'Unknown'
    }
  }

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) return null

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Password Changed!</h2>
          <p className="text-gray-600 mb-6">
            Your password has been updated successfully. You will be redirected to security settings.
          </p>
          
          <button
            onClick={() => router.push('/user/security')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Go to Security Settings
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <SecurityGuard
      isOpen={securityGuardOpen}
      onClose={() => setSecurityGuardOpen(false)}
      title="Verify Identity for Password Change"
      description="Please verify your identity before changing your password."
      requireMinimumMethods={1}
      onSuccess={completePasswordChange}
      onCancel={() => {
        setSecurityGuardOpen(false)
      }}
    >
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
                  Change Password
                </h1>
                <p className="text-gray-600 mt-1">Update your account password securely</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="text-center mb-8">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <LockClosedIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Change Your Password</h2>
              <p className="text-gray-600">
                Create a strong password to keep your account secure
              </p>
            </div>

            {/* Security Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-800 mb-1">Security Required</h3>
                  <p className="text-amber-700 text-sm">
                    You&apos;ll need to verify your identity using two-factor authentication before your password can be changed.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showCurrentPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Password Strength:</span>
                      <span className={`text-sm font-medium ${
                        passwordStrength.score >= 3 ? 'text-green-600' : 
                        passwordStrength.score >= 2 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {getStrengthText(passwordStrength.score)}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div 
                        className={`h-2 rounded-full transition-all ${getStrengthColor(passwordStrength.score)}`}
                        style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                      ></div>
                    </div>

                    {/* Requirements */}
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      {Object.entries(passwordStrength.requirements).map(([key, met]) => (
                        <div key={key} className={`flex items-center gap-1 ${met ? 'text-green-600' : 'text-gray-500'}`}>
                          {met ? (
                            <CheckCircleIcon className="h-3 w-3" />
                          ) : (
                            <XCircleIcon className="h-3 w-3" />
                          )}
                          <span>
                            {key === 'length' && 'At least 8 characters'}
                            {key === 'uppercase' && 'One uppercase letter'}
                            {key === 'lowercase' && 'One lowercase letter'}
                            {key === 'number' && 'One number'}
                            {key === 'special' && 'One special character'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {confirmPassword && (
                  <div className={`mt-2 flex items-center gap-2 text-sm ${
                    passwordsMatch ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {passwordsMatch ? (
                      <CheckCircleIcon className="h-4 w-4" />
                    ) : (
                      <XCircleIcon className="h-4 w-4" />
                    )}
                    <span>
                      {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || !isStrongPassword || !passwordsMatch || !currentPassword}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Change Password'}
                </button>
                
                <button
                  type="button"
                  onClick={() => router.push('/user/security')}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </SecurityGuard>
  )
} 