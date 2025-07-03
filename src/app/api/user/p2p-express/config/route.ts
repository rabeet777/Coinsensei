import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(_request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get P2P Express configuration
    let config: any = null
    try {
      const { data, error } = await supabase
        .rpc('get_p2p_express_config')
        .single()

      if (error) {
        console.log('No P2P config found, using defaults')
      } else {
        config = data
      }
    } catch (error) {
      console.log('Error fetching P2P config, using defaults:', error)
    }

    // If no config found, use defaults
    if (!config) {
      config = {
        buy_rate: 275.0000,
        sell_rate: 270.0000,
        min_order_amount: 100.00,
        max_order_amount: 10000.00,
        is_active: true,
        daily_buy_limit: 50000.00,
        daily_sell_limit: 50000.00
      }
    }

    // Get user's daily limits - fallback to defaults if user has no limits yet
    const defaultBuyLimit = config?.daily_buy_limit || 50000
    const defaultSellLimit = config?.daily_sell_limit || 50000
    
    let limits = {
      total_buy_amount: 0,
      total_sell_amount: 0,
      remaining_buy_limit: defaultBuyLimit,
      remaining_sell_limit: defaultSellLimit
    }

    try {
      const { data: userLimits, error: limitsError } = await supabase
        .rpc('get_user_daily_p2p_limits', { target_user_id: session.user.id })
        .single()

      if (!limitsError && userLimits) {
        limits = userLimits as any
      }
    } catch (error) {
      console.log('No daily limits found for user, using defaults')
    }

    return NextResponse.json({
      config,
      limits,
      success: true
    })

  } catch (error) {
    console.error('P2P Express config API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 