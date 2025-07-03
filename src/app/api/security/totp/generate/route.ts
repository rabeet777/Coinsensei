export const runtime = 'nodejs' // Fix edge runtime issue

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient as createAdmin } from '@supabase/supabase-js'
import * as speakeasy from 'speakeasy'
import * as QRCode from 'qrcode'

// Admin client for logging
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
      console.warn('Unauthorized TOTP generation attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    // ✅ SECURITY: Check if TOTP is already enabled
    const { data: existingSecurity } = await supabaseAdmin
      .from('user_security')
      .select('totp_enabled')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingSecurity?.totp_enabled) {
      return NextResponse.json({ 
        error: 'TOTP is already enabled for this account' 
      }, { status: 400 })
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `CoinSensei (${user.email || userId.slice(0, 8)})`,
      issuer: 'CoinSensei',
      length: 32
    })

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!)

    // ✅ SECURITY: Log the TOTP generation attempt
    await supabaseAdmin
      .from('security_audit_logs')
      .insert([{
        user_id: userId,
        action: 'TOTP_SECRET_GENERATED',
        metadata: JSON.stringify({ 
          issuer: 'CoinSensei',
          method: 'qr_code'
        }),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString()
      }])

    return NextResponse.json({
      secret: secret.base32,
      qrCode: qrCode,
      backupCodes: generateBackupCodes(), // Generate backup codes
      instructions: 'Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)'
    })

  } catch (error) {
    console.error('TOTP generate error:', error)
    return NextResponse.json(
      { error: 'Failed to generate TOTP secret' },
      { status: 500 }
    )
  }
}

// ✅ SECURITY: Generate backup codes for account recovery
function generateBackupCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < 10; i++) {
    // Generate 8-digit backup codes
    const code = Math.random().toString().slice(2, 10)
    codes.push(code)
  }
  return codes
} 