export const runtime = 'nodejs' // Fix edge runtime issue

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient as createAdmin } from '@supabase/supabase-js'
import * as speakeasy from 'speakeasy'

// Admin client for RLS bypass when needed
const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user
    const cookiesStore = cookies
    const supabase = createRouteHandlerClient({ cookies: cookiesStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.warn('Unauthorized TOTP setup attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token, secret } = await request.json()
    
    if (!token || !secret) {
      return NextResponse.json({ error: 'Missing TOTP token or secret' }, { status: 400 })
    }

    // ✅ SECURITY: Only allow users to set up TOTP for themselves
    const userId = user.id

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time windows for clock skew
    })

    if (!verified) {
      return NextResponse.json({ error: 'Invalid TOTP code' }, { status: 400 })
    }

    // ✅ SECURITY: Use admin client to bypass RLS for upsert
    const { error } = await supabaseAdmin
      .from('user_security')
      .upsert(
        [{ 
          user_id: userId, 
          totp_enabled: true,
          totp_secret: secret,
          updated_at: new Date().toISOString()
        }],
        { onConflict: 'user_id' }
      )

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to enable TOTP' }, { status: 500 })
    }

    // ✅ SECURITY: Log the successful TOTP setup
    await supabaseAdmin
      .from('security_audit_logs')
      .insert([{
        user_id: userId,
        action: 'TOTP_ENABLED',
        metadata: JSON.stringify({ setup_method: 'app' }),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString()
      }])

    return NextResponse.json({ 
      success: true,
      message: 'TOTP authentication has been enabled for your account'
    })

  } catch (error) {
    console.error('TOTP verify setup error:', error)
    return NextResponse.json(
      { error: 'Failed to verify TOTP setup' },
      { status: 500 }
    )
  }
} 