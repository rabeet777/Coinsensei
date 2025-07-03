import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' })
  }

  const { email } = req.body as { email?: string }

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' })
  }

  console.log('Checking user existence for email:', email)

  try {
    // List all users and find by email (since getUserByEmail doesn't exist)
    const { data: usersList, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error('Failed to list users:', authError)
      return res.status(500).json({ error: 'Failed to check user' })
    }

    // Find user by email
    const foundUser = usersList?.users?.find(user => user.email === email)

    if (!foundUser) {
      console.log('User not found for email:', email)
      return res.status(200).json({ 
        userExists: false,
        message: 'User not found'
      })
    }

    console.log('Found user:', { id: foundUser.id, email: foundUser.email })

    // Get user profile for phone number
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profile')
      .select('phone_number')
      .eq('uid', foundUser.id)
      .single()

    console.log('Profile lookup:', { profile, profileError })

    // Get user's security methods
    const { data: security, error: secError } = await supabaseAdmin
      .from('user_security')
      .select('totp_enabled, sms_enabled, email_enabled')
      .eq('user_id', foundUser.id)
      .single()

    console.log('Security methods lookup:', { security, secError })

    const securityMethods = security || { 
      totp_enabled: false, 
      sms_enabled: false, 
      email_enabled: false 
    }

    return res.status(200).json({
      userExists: true,
      userId: foundUser.id,
      phoneNumber: profile?.phone_number || null,
      securityMethods: securityMethods
    })

  } catch (error: unknown) {
    console.error('Error checking user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to check user existence'
    return res.status(500).json({ 
      error: errorMessage
    })
  }
} 