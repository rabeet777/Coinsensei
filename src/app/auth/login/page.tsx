// src/app/login/page.tsx
'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  EyeIcon, 
  EyeSlashIcon,
  ArrowLeftIcon,
  LockClosedIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import SecurityGuard from '@/components/SecurityGuard'
import { CoinsenseiLogo } from '@/components/ui/coinsensei-logo'
import { Button } from '@/components/ui/button'
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Light Bubble Background */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-2 h-2 bg-blue-200 rounded-full animate-pulse opacity-30"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-purple-200 rounded-full animate-ping opacity-20"></div>
        <div className="absolute top-40 left-1/4 w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce opacity-25"></div>
        <div className="absolute top-60 right-1/3 w-1 h-1 bg-blue-200 rounded-full animate-pulse opacity-30"></div>
        <div className="absolute top-80 left-1/2 w-2 h-2 bg-purple-200 rounded-full animate-ping opacity-20"></div>
        <div className="absolute top-32 right-1/4 w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce opacity-25"></div>
        <div className="absolute top-96 left-1/3 w-1 h-1 bg-blue-200 rounded-full animate-pulse opacity-30"></div>
        <div className="absolute top-64 right-1/2 w-2 h-2 bg-purple-200 rounded-full animate-ping opacity-20"></div>
        <div className="absolute top-48 left-1/3 w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce opacity-25"></div>
        <div className="absolute top-72 right-1/4 w-1 h-1 bg-blue-200 rounded-full animate-pulse opacity-30"></div>
      </div>

      {/* Back to Landing Page Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-6 left-6 z-20"
      >
        <Button
          onClick={() => router.push('/')}
          variant="outline"
          size="sm"
          className="border-2 border-blue-500/50 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 backdrop-blur-sm bg-white/80 font-medium px-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </motion.div>

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20"
        >
          {/* Logo and Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-center mb-8"
          >
            <div className="flex justify-center mb-4">
              <CoinsenseiLogo size="xl" showText={false} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">Sign in to your account to continue trading</p>
          </motion.div>

          <form onSubmit={handleLogin} className="space-y-6">
            <AnimatePresence>
              {loginError && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-4"
                >
                                     <p className="text-red-800 text-sm flex items-center gap-2">
                     <ShieldCheckIcon className="h-4 w-4" />
                     {loginError}
                   </p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
                             <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                 <EnvelopeIcon className="h-4 w-4 text-blue-600" />
                 Email Address
               </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                placeholder="Enter your email"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
                             <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                 <LockClosedIcon className="h-4 w-4 text-blue-600" />
                 Password
               </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-4 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              {/* Forgot Password Link */}
              <div className="text-right mt-3">
                <button
                  type="button"
                  onClick={() => router.push('/auth/forgot-password')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors hover:underline"
                >
                  Forgot your password?
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Button
                type="submit"
                disabled={loginLoading}
                className="w-full btn-shimmer btn-glow shadow-xl py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing In...
                  </div>
                ) : (
                                     <div className="flex items-center gap-2">
                     <SparklesIcon className="h-5 w-5" />
                     Sign In
                   </div>
                )}
              </Button>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-8 text-center"
          >
            <p className="text-gray-600 text-sm">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => router.push('/auth/signup')}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors hover:underline"
              >
                Sign up now
              </button>
            </p>
          </motion.div>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Light Bubble Background */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-2 h-2 bg-blue-200 rounded-full animate-pulse opacity-30"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-purple-200 rounded-full animate-ping opacity-20"></div>
        <div className="absolute top-40 left-1/4 w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce opacity-25"></div>
        <div className="absolute top-60 right-1/3 w-1 h-1 bg-blue-200 rounded-full animate-pulse opacity-30"></div>
        <div className="absolute top-80 left-1/2 w-2 h-2 bg-purple-200 rounded-full animate-ping opacity-20"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <CoinsenseiLogo size="lg" showText={false} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Loading...</p>
          </div>
          <div className="space-y-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-14 bg-gray-200 rounded-xl"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-14 bg-gray-200 rounded-xl"></div>
              <div className="h-14 bg-gray-200 rounded-xl"></div>
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
