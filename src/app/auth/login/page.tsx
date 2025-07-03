// src/app/login/page.tsx
'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion } from 'framer-motion'
import { 
  EyeIcon, 
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import SecurityGuard from '@/components/SecurityGuard'
import type { Database } from '@/lib/database.types'

function LoginContent() {
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams?.get('redirectTo') || '/user/dashboard'

  // Login form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)

  // 2FA state
  const [userRole, setUserRole] = useState<string | null>(null)
  const [showSecurityGuard, setShowSecurityGuard] = useState(false)

  // Handle basic login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setLoginLoading(true)

    try {
      // 1) Basic authentication
      const { data: { user, session }, error: authErr } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })

      if (authErr) {
        throw new Error(authErr.message)
      }

      if (!session || !user) {
        throw new Error('Check your email to confirm your account.')
      }

      // 2) Get user profile and role
      const { data: profile, error: profErr } = await supabase
        .from('user_profile')
        .select('role')
        .eq('uid', user.id)
        .single()

      if (profErr || !profile) {
        throw new Error('Failed to load user profile.')
      }

      setUserRole(profile.role)

      // 3) Check security methods
      const { data: security, error: secErr } = await supabase
        .from('user_security')
        .select('totp_enabled, sms_enabled, email_enabled')
        .eq('user_id', user.id)
        .single()

      if (secErr && secErr.code !== 'PGRST116') {
        console.warn('Security check error:', secErr)
      }

      const userSecurity = security || { totp_enabled: false, sms_enabled: false, email_enabled: false }

      // 4) Check if 2FA is required
      const has2FA = userSecurity.totp_enabled || userSecurity.sms_enabled || userSecurity.email_enabled

      if (has2FA) {
        // Show SecurityGuard for 2FA verification
        setShowSecurityGuard(true)
        toast.info('Please complete two-factor authentication')
      } else {
        // No 2FA required, proceed with login
        completeLogin(profile.role)
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setLoginError(errorMessage)
      toast.error('Login failed')
    } finally {
      setLoginLoading(false)
    }
  }

  // Complete login after 2FA
  const completeLogin = (role: string) => {
    toast.success('Login successful!')
    
    if (role === 'admin') {
      router.push('/admin/dashboard')
    } else {
      router.push(redirectTo)
    }
  }

  // Handle SecurityGuard success
  const handleSecuritySuccess = () => {
    if (userRole) {
      completeLogin(userRole)
    }
  }

  // Handle SecurityGuard cancel
  const handleSecurityCancel = () => {
    setShowSecurityGuard(false)
    // Reset login state
    setUserRole(null)
    toast.info('Login cancelled')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {loginError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{loginError}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              {/* Forgot Password Link */}
              <div className="text-right mt-2">
                <button
                  type="button"
                  onClick={() => router.push('/auth/forgot-password')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => router.push('/auth/signup')}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Sign up
              </button>
            </p>
          </div>
        </motion.div>
      </div>

      {/* SecurityGuard for 2FA */}
      <SecurityGuard
        isOpen={showSecurityGuard}
        onClose={() => setShowSecurityGuard(false)}
        onSuccess={handleSecuritySuccess}
        onCancel={handleSecurityCancel}
        title="Two-Factor Authentication"
        description="Choose at least one verification method to complete login."
        requireMinimumMethods={1}
      >
        <></>
      </SecurityGuard>
    </div>
  )
}

// Loading fallback component
function LoginLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">Loading...</p>
          </div>
          <div className="space-y-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main page component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  )
}
