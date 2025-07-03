import type { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { authenticator, totp } from 'otplib'

// Supabase admin client for password reset verification
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code, user_id, action = 'withdrawal' } = req.body as { 
    code?: string
    user_id?: string
    action?: string 
  }

  let userId: string
  let supabaseClient

  // For password reset, we don't require authentication but need user_id
  if (action === 'password_reset') {
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required for password reset' })
    }
    userId = user_id
    supabaseClient = supabaseAdmin
  } else {
    // For normal withdrawal/login verification, check authentication
  const supabase = createPagesServerClient({ req, res })
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
    userId = user.id
    supabaseClient = supabase
  }

  // Validate code format
  if (!code || !/^[0-9]{6}$/.test(code)) {
    console.log('Invalid code format:', code)
    return res.status(400).json({ error: 'Invalid code format. Must be 6 digits.' })
  }

  try {
    // Get user's TOTP settings from database
    const { data: securityData, error: securityError } = await supabaseClient
      .from('user_security')
      .select('totp_enabled, totp_secret')
      .eq('user_id', userId)
      .single()

    console.log('Security data for user:', userId, {
      hasData: !!securityData,
      totpEnabled: securityData?.totp_enabled,
      hasSecret: !!securityData?.totp_secret,
      secretLength: securityData?.totp_secret?.length,
      action: action
    })

    if (securityError || !securityData) {
      console.log('Security settings error:', securityError)
      return res.status(400).json({ error: 'Security settings not found' })
    }

    if (!securityData.totp_enabled) {
      console.log('TOTP not enabled for user:', userId)
      return res.status(400).json({ error: 'TOTP not enabled' })
    }

    if (!securityData.totp_secret) {
      console.log('TOTP secret not found for user:', userId)
      return res.status(400).json({ error: 'TOTP secret not configured' })
    }

    // Try multiple verification approaches
    let isValid = false
    let verificationMethod = ''

    const secret = securityData.totp_secret.trim()
    
    console.log('Attempting TOTP verification for user:', userId, {
      code: code,
      action: action,
      secretFormat: {
        length: secret.length,
        isBase32: /^[A-Z2-7]+$/.test(secret),
        preview: secret.substring(0, 10) + '...'
      }
    })

    // Method 1: Try direct verification (for Base32 secrets)
    try {
      authenticator.options = {
        window: 2, // Allow 2 steps before and after (more lenient)
        step: 30   // 30 second time step
      }

      isValid = authenticator.verify({
        token: code,
        secret: secret
      })

      if (isValid) {
        verificationMethod = 'direct_base32'
        console.log('Verification successful with method:', verificationMethod)
      }
    } catch (err) {
      console.log('Direct verification failed:', err)
    }

    // Method 2: Try with totp.verify if authenticator failed
    if (!isValid) {
      try {
        totp.options = {
          window: 2,
          step: 30
        }

        isValid = totp.verify({
          token: code,
          secret: secret
        })

        if (isValid) {
          verificationMethod = 'totp_verify'
          console.log('Verification successful with method:', verificationMethod)
        }
      } catch (err) {
        console.log('TOTP verify failed:', err)
      }
    }

    // Method 3: Try generating current token to compare
    if (!isValid) {
      try {
        const currentToken = authenticator.generate(secret)
        console.log('Generated current token for comparison:', currentToken)
        
        // Check if the provided code matches the current token
        if (code === currentToken) {
          isValid = true
          verificationMethod = 'token_comparison'
          console.log('Verification successful with method:', verificationMethod)
        }
      } catch (err) {
        console.log('Token generation failed:', err)
      }
    }

    console.log('Final verification result:', {
      userId: userId,
      providedCode: code,
      isValid: isValid,
      method: verificationMethod,
      action: action
    })

    if (!isValid) {
      console.log('All TOTP verification methods failed for user:', userId, 'code:', code)
      return res.status(400).json({ error: 'Invalid TOTP code' })
    }

    // For password reset, log the verification attempt
    if (action === 'password_reset') {
      try {
        const { error: logError } = await supabaseAdmin
          .from('admin_actions')
          .insert({
            action_type: 'password_reset_totp_verified',
            target_user_id: userId,
            details: { action, method: verificationMethod, verified_at: new Date().toISOString() }
          })
        
        if (logError) {
          console.warn('Failed to log admin action:', logError)
        }
      } catch (err) {
        console.warn('Failed to log TOTP verification:', err)
      }
    }

    console.log('TOTP verification successful for user:', userId, 'method:', verificationMethod, 'action:', action)
    return res.status(200).json({ 
      success: true,
      verified: true,
      message: 'TOTP verified successfully',
      method: verificationMethod,
      action: action,
      user_id: userId
    })

  } catch (err: any) {
    console.error('TOTP verification error:', err)
    return res.status(500).json({ error: 'Verification failed' })
  }
} 