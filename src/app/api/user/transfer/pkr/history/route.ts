import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const cookiesStore = cookies
    const supabase = createRouteHandlerClient({ cookies: cookiesStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Check if user account is locked
    const { data: profile } = await supabaseAdmin
      .from('user_profile')
      .select('is_locked')
      .eq('uid', user.id)
      .single()

    if (profile?.is_locked) {
      return NextResponse.json({ 
        error: 'Your account is locked. Contact support.' 
      }, { status: 403 })
    }

    // Get transfer history using the database function
    const { data: transfers, error: transferError } = await supabaseAdmin.rpc(
      'get_user_pkr_transfers',
      {
        target_user_id: user.id,
        limit_count: limit
      }
    )

    if (transferError) {
      console.error('Transfer history error:', transferError)
      return NextResponse.json({ 
        error: 'Failed to fetch transfer history' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      transfers: transfers || [],
      count: transfers?.length || 0
    })

  } catch (error) {
    console.error('PKR transfer history error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 