'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EmailOtpLoginPage() {
  const router = useRouter()

  const [email, setEmail]         = useState('')
  const [code, setCode]           = useState('')
  const [step, setStep]           = useState<'enterEmail'|'enterCode'>('enterEmail')
  const [errorMsg, setErrorMsg]   = useState<string|null>(null)
  const [loading, setLoading]     = useState(false)

  // 1️⃣ Send the OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    // — ensure the email is in your user_profile table —
    const { data: profile, error: pErr } = await supabase
      .from('user_profile')
      .select('uid')
      .eq('email', email)
      .single()

    if (pErr || !profile) {
      setErrorMsg('No user found with that email.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      // ✋ no redirect URL → pure OTP
      options: { shouldCreateUser: false }
    })
    setLoading(false)

    if (error) {
      setErrorMsg(error.message)
    } else {
      setStep('enterCode')
    }
  }

  // 2️⃣ Verify the 6‑digit code
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email'
    })
    setLoading(false)

    if (error) {
      setErrorMsg(error.message)
    } else {
      // logged in!
      router.push('/user/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white shadow rounded-lg p-8">
        {step === 'enterEmail' ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Login via OTP</h2>
            {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sending OTP…' : 'Send me a code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Enter your code</h2>
            {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
            <input
              type="text"
              placeholder="6‑digit code"
              value={code}
              onChange={e => setCode(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Verify & Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
