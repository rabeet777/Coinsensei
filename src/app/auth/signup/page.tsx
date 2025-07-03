// File: src/app/signup/page.tsx
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

export default function SignupPage() {
  const router   = useRouter()
  const supabase = createClientComponentClient<Database>()

  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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
          setMessage({ type: 'info', text: 'Signed up, but couldn’t create TRC20 address right now. Please try again later.' })
        }
      }

      // 4) Finally: if we have a session, redirect to /user/dashboard; otherwise show “check your email”
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 px-4">
      <motion.form
        onSubmit={handleSignup}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h2
          className="text-3xl font-bold text-center text-gray-800"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Create Account
        </motion.h2>

        {message && (
          <motion.p
            className={`text-center text-sm ${
              message.type === 'error' ? 'text-red-500' : 'text-blue-600'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {message.text}
          </motion.p>
        )}

        <motion.input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-lg focus:ring-blue-400 focus:ring-2 outline-none"
          whileFocus={{ scale: 1.02 }}
        />

        <motion.input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-lg focus:ring-blue-400 focus:ring-2 outline-none"
          whileFocus={{ scale: 1.02 }}
        />

        <motion.input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-lg focus:ring-blue-400 focus:ring-2 outline-none"
          whileFocus={{ scale: 1.02 }}
        />

        <motion.button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
          whileHover={!loading ? { scale: 1.05 } : {}}
          whileTap={!loading ? { scale: 0.95 } : {}}
        >
          {loading ? 'Signing up…' : 'Sign Up'}
        </motion.button>

        <motion.p
          className="text-center text-sm text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Already have an account?{' '}
          <motion.a
            href="/login"
            className="text-blue-600 hover:underline"
            whileHover={{ scale: 1.02 }}
          >
            Log in here
          </motion.a>
        </motion.p>
      </motion.form>
    </div>
  )
}
