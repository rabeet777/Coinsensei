// pages/api/sms/verify.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import Twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'

/** 
 * Service‑role key gives full DB access; keep it secret.
 * Make sure SUPABASE_SERVICE_ROLE_KEY is set in your env.
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const twilio = Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)
const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID!

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' })
  }

  const { code, userId, user_id, action = 'login' } = req.body as { 
    code?: string
    userId?: string
    user_id?: string
    action?: string
  }

  // Support both userId (legacy) and user_id (new)
  const targetUserId = userId || user_id

  if (!code || !targetUserId) {
    return res.status(400).json({ error: 'Missing code or user ID' })
  }

  if (code.length !== 6) {
    return res.status(400).json({ error: 'Verification code must be 6 digits' })
  }

  // 1) Look up phone for this user
  const { data: profile, error: profErr } = await supabaseAdmin
    .from('user_profile')
    .select('phone_number')
    .eq('uid', targetUserId)
    .single()

  if (profErr || !profile?.phone_number) {
    return res.status(400).json({ error: 'No phone number on file for this user' })
  }

  // Format phone for verification (same as send)
  const cleanPhone = profile.phone_number.replace(/\D/g, '')
  const formattedPhone = cleanPhone.startsWith('92') 
    ? `+${cleanPhone}` 
    : cleanPhone.startsWith('0')
    ? `+92${cleanPhone.slice(1)}`
    : `+92${cleanPhone}`

  // 2) Verify code with Twilio
  let check
  try {
    check = await twilio.verify
      .services(serviceSid)
      .verificationChecks.create({
        to: formattedPhone,
        code: code.trim(),
      })
  } catch (err: any) {
    console.error('Twilio verify error', err)
    
    // Handle Twilio-specific errors
    if (err.code === 20404) {
      return res.status(400).json({ error: 'Verification code has expired or is invalid' })
    }

    if (err.code === 60202) {
      return res.status(429).json({ error: 'Maximum verification attempts reached' })
    }

    return res.status(500).json({ error: 'Verification service error' })
  }

  if (check.status !== 'approved') {
    return res.status(400).json({ error: 'Invalid or expired verification code' })
  }

  // 3) Handle different actions
  if (action === 'password_reset') {
    // For password reset, just log the verification - don't update SMS settings
    try {
      const { error: logError } = await supabaseAdmin
        .from('admin_actions')
        .insert({
          action_type: 'password_reset_sms_verified',
          target_user_id: targetUserId,
          details: { phone: formattedPhone, action, verified_at: new Date().toISOString() }
        })
      
      if (logError) {
        console.warn('Failed to log admin action:', logError)
      }
    } catch (err) {
      console.warn('Failed to log SMS verification:', err)
    }

    return res.status(200).json({ 
      success: true, 
      verified: true,
      action,
      phone: formattedPhone
    })
  } else {
    // For login/signup, mark SMS enabled in security table
  const { error: upsertErr } = await supabaseAdmin
    .from('user_security')
    .upsert(
        [{ user_id: targetUserId, sms_enabled: true }],
      { onConflict: 'user_id' }
    )

  if (upsertErr) {
    console.error('User security upsert error', upsertErr)
    return res.status(500).json({ error: upsertErr.message })
  }

    return res.status(200).json({ 
      ok: true,
      success: true,
      verified: true,
      action
    })
  }
}
