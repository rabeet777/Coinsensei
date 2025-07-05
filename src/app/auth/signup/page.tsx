// File: src/app/signup/page.tsx
'use client'

import React, { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  EyeIcon, 
  EyeSlashIcon,
  ArrowLeftIcon,
  LockClosedIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserPlusIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { CoinsenseiLogo } from '@/components/ui/coinsensei-logo'
import { Button } from '@/components/ui/button'
import type { Database } from '@/lib/database.types'

function SignupContent() {
  const router   = useRouter()
  const supabase = createClientComponentClient<Database>()

  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  // message.type==='error' to show red text; type==='info' for blue text.
  const [message,         setMessage]         = useState<{ type: 'error'|'info'; text: string }|null>(null)
  const [loading,         setLoading]         = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }

    setLoading(true)
    try {
      // 1) Create user via Supabase Auth
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error

      const user = data.user
      if (!user) throw new Error('Signup failed: no user returned.')

      // 2) Insert a row into user_profile (as you already do)
      const { error: profileError } = await supabase
        .from('user_profile')
        .insert([{ uid: user.id }])
      if (profileError) {
        console.warn('Could not insert into user_profile:', profileError.message)
      }

      // 3) *New:* If Supabase gave us a session (i.e. auto-confirm is ON),
      //    then immediately generate & store a TRC20 address for this user.
      if (data.session && data.session.access_token) {
        try {
          const resp = await fetch('/api/trc20/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${data.session.access_token}`
            }
          })
          const payload = await resp.json()
          if (!resp.ok) {
            // If address generation fails, show the error but don't block signup entirely:
            throw new Error(payload.error || 'Failed to generate TRC20 address')
          }
          console.log('New TRC20 address:', payload.address)
          // At this point, user_wallets already has a row for user.id with address = payload.address.
        } catch (genErr: any) {
          console.error('Error generating TRC20 on signup:', genErr)
          // Optionally, show a warning in the UI—but signup itself succeeded:
          setMessage({ type: 'info', text: 'Signed up, but could not create TRC20 address right now. Please try again later.' })
        }
      }

      // 4) Finally: if we have a session, redirect to /user/dashboard; otherwise show "check your email"
      if (data.session) {
        router.push('/user/dashboard')
      } else {
        setMessage({ type: 'info', text: 'Check your email to confirm your account.' })
      }

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
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
              Create Account
            </h1>
            <p className="text-gray-600">Join thousands of traders on Pakistan's most trusted P2P platform</p>
          </motion.div>

          <form onSubmit={handleSignup} className="space-y-6">
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className={`rounded-xl p-4 border ${
                    message.type === 'error' 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <p className={`text-sm flex items-center gap-2 ${
                    message.type === 'error' ? 'text-red-800' : 'text-blue-800'
                  }`}>
                    {message.type === 'error' ? (
                      <ShieldCheckIcon className="h-4 w-4" />
                    ) : (
                      <CheckCircleIcon className="h-4 w-4" />
                    )}
                    {message.text}
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
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
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
                  placeholder="Create a strong password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-4 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <LockClosedIcon className="h-4 w-4 text-blue-600" />
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-4 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <Button
                type="submit"
                disabled={loading}
                className="w-full btn-shimmer btn-glow shadow-xl py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating Account...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <UserPlusIcon className="h-5 w-5" />
                    Create Account
                  </div>
                )}
              </Button>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-8 text-center"
          >
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/auth/login')}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors hover:underline"
              >
                Sign in here
              </button>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

// Loading fallback component
function SignupLoading() {
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
              <CoinsenseiLogo size="xl" showText={false} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Loading...</p>
          </div>
          <div className="space-y-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-14 bg-gray-200 rounded-xl"></div>
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
export default function SignupPage() {
  return (
    <Suspense fallback={<SignupLoading />}>
      <SignupContent />
    </Suspense>
  )
}
