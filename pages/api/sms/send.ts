// pages/api/sms/send.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import Twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'

const accountSid = process.env.TWILIO_ACCOUNT_SID!
const authToken  = process.env.TWILIO_AUTH_TOKEN!
const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID!
const client     = Twilio(accountSid, authToken)

// Supabase client for database operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' })
  }

  const { phone, user_id, action = 'login' } = req.body as { 
    phone?: string
    user_id?: string
    action?: string
  }

  let targetPhone = phone

  // For password reset, get phone from user_id
  if (action === 'password_reset' && user_id) {
    try {
      const { data: profile, error } = await supabase
        .from('user_profile')
        .select('phone_number')
        .eq('uid', user_id)
        .single()

      if (error || !profile?.phone_number) {
        return res.status(404).json({ error: 'Phone number not found for this user' })
      }

      targetPhone = profile.phone_number
    } catch (err) {
      console.error('Database error:', err)
      return res.status(500).json({ error: 'Failed to lookup user phone number' })
    }
  }

  if (!targetPhone) {
    return res.status(400).json({ error: 'Phone number is required' })
  }

  try {
    // Format phone for Pakistan (+92)
    const cleanPhone = targetPhone.replace(/\D/g, '')
    const formattedPhone = cleanPhone.startsWith('92') 
      ? `+${cleanPhone}` 
      : cleanPhone.startsWith('0')
      ? `+92${cleanPhone.slice(1)}`
      : `+92${cleanPhone}`

    // Send the SMS OTP
    const verification = await client.verify
      .services(serviceSid)
      .verifications.create({ 
        to: formattedPhone, 
        channel: 'sms',
        customFriendlyName: action === 'password_reset' 
          ? 'COINSENSEI Password Reset'
          : 'COINSENSEI Login Verification'
      })

    return res.status(200).json({ 
      success: true, 
      sid: verification.sid,
      phone: formattedPhone,
      action
    })
  } catch (err: any) {
    console.error('Twilio send error', err)
    
    // Handle Twilio-specific errors
    if (err.code === 60200) {
      return res.status(400).json({ error: 'Invalid phone number format' })
    }
    
    if (err.code === 60203) {
      return res.status(400).json({ error: 'Phone number is not verified with Twilio' })
    }

    return res.status(500).json({ error: err.message || 'Failed to send SMS verification' })
  }
}
