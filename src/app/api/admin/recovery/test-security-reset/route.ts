import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    console.log(`Testing security reset for user: ${user_id}`)

    // Check current user_security record
    const { data: beforeReset, error: selectError } = await supabaseAdmin
      .from('user_security')
      .select('*')
      .eq('user_id', user_id)
      .single()

    console.log('Before reset:', beforeReset)
    if (selectError) console.log('Select error:', selectError)

    // Perform security reset
    const { data: resetData, error: resetError } = await supabaseAdmin
      .from('user_security')
      .upsert({
        user_id: user_id,
        totp_enabled: false,
        sms_enabled: false,
        email_enabled: false,
        totp_secret: null,
        totp_secret_encrypted: null,
        totp_factor_sid: null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (resetError) {
      return NextResponse.json({ 
        error: 'Failed to reset security methods',
        details: resetError,
        before: beforeReset
      }, { status: 500 })
    }

    // Verify the reset
    const { data: afterReset, error: verifyError } = await supabaseAdmin
      .from('user_security')
      .select('*')
      .eq('user_id', user_id)
      .single()

    return NextResponse.json({ 
      success: true,
      message: 'Security reset test completed successfully',
      data: {
        before: beforeReset,
        after: afterReset,
        reset_successful: afterReset?.totp_enabled === false && 
                          afterReset?.sms_enabled === false && 
                          afterReset?.email_enabled === false
      }
    })

  } catch (error) {
    console.error('Security reset test error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 