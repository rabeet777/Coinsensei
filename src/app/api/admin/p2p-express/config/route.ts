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

    // TODO: Add admin role check
    // For now, assuming admin access is handled by middleware or other means

    // Get P2P Express configuration
    const { data: configs, error } = await supabase
      .from('p2p_express_config')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching P2P config:', error)
      return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 })
    }

    // If no config exists, create default one
    let config = configs?.[0]
    if (!config) {
      const { data: newConfig, error: createError } = await supabase
        .from('p2p_express_config')
        .insert({
          buy_rate: 275.0000,
          sell_rate: 270.0000,
          min_order_amount: 100.00,
          max_order_amount: 10000.00,
          is_active: true,
          daily_buy_limit: 50000.00,
          daily_sell_limit: 50000.00
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating default config:', createError)
        return NextResponse.json({ error: 'Failed to create configuration' }, { status: 500 })
      }
      config = newConfig
    }

    return NextResponse.json({
      config,
      success: true
    })

  } catch (error) {
    console.error('Admin P2P Express config API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add admin role check

    const body = await request.json()
    const { 
      buy_rate, 
      sell_rate, 
      min_order_amount, 
      max_order_amount, 
      is_active, 
      daily_buy_limit, 
      daily_sell_limit 
    } = body

    // Validate input
    if (buy_rate !== undefined && (buy_rate <= 0 || buy_rate > 1000000)) {
      return NextResponse.json({ error: 'Invalid buy rate' }, { status: 400 })
    }

    if (sell_rate !== undefined && (sell_rate <= 0 || sell_rate > 1000000)) {
      return NextResponse.json({ error: 'Invalid sell rate' }, { status: 400 })
    }

    if (min_order_amount !== undefined && min_order_amount < 0) {
      return NextResponse.json({ error: 'Invalid minimum order amount' }, { status: 400 })
    }

    if (max_order_amount !== undefined && max_order_amount < 0) {
      return NextResponse.json({ error: 'Invalid maximum order amount' }, { status: 400 })
    }

    if (min_order_amount !== undefined && max_order_amount !== undefined && min_order_amount > max_order_amount) {
      return NextResponse.json({ error: 'Minimum order amount cannot be greater than maximum' }, { status: 400 })
    }

    // Get current config
    const { data: currentConfigs, error: fetchError } = await supabase
      .from('p2p_express_config')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    if (fetchError) {
      console.error('Error fetching current config:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch current configuration' }, { status: 500 })
    }

    // If no config exists, create default one first
    let currentConfig = currentConfigs?.[0]
    if (!currentConfig) {
      const { data: newConfig, error: createError } = await supabase
        .from('p2p_express_config')
        .insert({
          buy_rate: 275.0000,
          sell_rate: 270.0000,
          min_order_amount: 100.00,
          max_order_amount: 10000.00,
          is_active: true,
          daily_buy_limit: 50000.00,
          daily_sell_limit: 50000.00
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating default config:', createError)
        return NextResponse.json({ error: 'Failed to create configuration' }, { status: 500 })
      }
      currentConfig = newConfig
    }

    // Update configuration
    const updateData = {
      buy_rate: buy_rate !== undefined ? buy_rate : currentConfig.buy_rate,
      sell_rate: sell_rate !== undefined ? sell_rate : currentConfig.sell_rate,
      min_order_amount: min_order_amount !== undefined ? min_order_amount : currentConfig.min_order_amount,
      max_order_amount: max_order_amount !== undefined ? max_order_amount : currentConfig.max_order_amount,
      is_active: is_active !== undefined ? is_active : currentConfig.is_active,
      daily_buy_limit: daily_buy_limit !== undefined ? daily_buy_limit : currentConfig.daily_buy_limit,
      daily_sell_limit: daily_sell_limit !== undefined ? daily_sell_limit : currentConfig.daily_sell_limit,
      updated_at: new Date().toISOString()
    }

    const { data: updatedConfig, error: updateError } = await supabase
      .from('p2p_express_config')
      .update(updateData)
      .eq('id', currentConfig.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating P2P config:', updateError)
      return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 })
    }

    // Log admin action
    try {
      await supabase
        .from('admin_actions')
        .insert({
          admin_user_id: session.user.id,
          action_type: 'p2p_config_update',
          target_type: 'system',
          details: {
            old_config: currentConfig,
            new_config: updatedConfig,
            timestamp: new Date().toISOString()
          }
        })
    } catch (logError) {
      console.error('Error logging admin action:', logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      config: updatedConfig,
      success: true,
      message: 'Configuration updated successfully'
    })

  } catch (error) {
    console.error('Admin P2P Express config update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 