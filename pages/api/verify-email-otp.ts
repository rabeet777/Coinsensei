// pages/api/verify-email-otp.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import otpStore, { getOTP, deleteOTP } from '../../src/lib/otpStore'

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' })
  }

  const { email, code, action = 'login' } = req.body as { 
    email?: string
    code?: string
    action?: string 
  }

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and verification code are required' })
  }

  if (code.length !== 6) {
    return res.status(400).json({ error: 'Verification code must be 6 digits' })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' })
  }

  console.log('Email OTP verification request:', { email, code, action })

  try {
    // Check OTP using shared store
    const otpKey = `${email}:${action}`
    const storedOTP = getOTP(otpKey)

    console.log('OTP lookup:', { otpKey, found: !!storedOTP })

    if (!storedOTP) {
      return res.status(404).json({ 
        error: 'No verification code found. Please request a new one.' 
      })
    }

    // Check if OTP is expired
    if (Date.now() > storedOTP.expires) {
      deleteOTP(otpKey)
      console.log('OTP expired for:', otpKey)
      return res.status(400).json({ 
        error: 'Verification code has expired. Please request a new one.' 
      })
    }

    // Verify the code
    if (storedOTP.code !== code) {
      console.log('Invalid OTP code:', { provided: code, expected: storedOTP.code })
      return res.status(400).json({ error: 'Invalid verification code' })
    }

    // Code is valid, remove it from store
    deleteOTP(otpKey)
    console.log('Email OTP verified successfully for:', email)

    // For password reset, log the verification attempt
    if (action === 'password_reset') {
      try {
        // Get user ID using Auth Admin listUsers
        const { data: usersList, error: authError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (!authError && usersList?.users) {
          const foundUser = usersList.users.find(user => user.email === email)
          
          if (foundUser) {
            // Log the password reset verification attempt
            const { error: logError } = await supabaseAdmin
              .from('admin_actions')
              .insert({
                action_type: 'password_reset_email_verified',
                target_user_id: foundUser.id,
                details: { email, action, verified_at: new Date().toISOString() }
  })

            if (logError) {
              console.warn('Failed to log admin action:', logError)
            }
          }
        }
      } catch (err) {
        console.warn('Failed to log email verification:', err)
      }
    }

    return res.status(200).json({ 
      success: true, 
      verified: true,
      action,
      email
    })

  } catch (error: any) {
    console.error('Email OTP verify error:', error)
    return res.status(500).json({ 
      error: error.message || 'Failed to verify email code' 
    })
  }
}

// Store reference for cross-endpoint access (in production, use Redis)
export { otpStore }
