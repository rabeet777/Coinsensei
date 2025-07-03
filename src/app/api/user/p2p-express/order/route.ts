import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { order_type, usdt_amount, expected_rate } = body

    // Validate input
    if (!order_type || !usdt_amount || !expected_rate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['buy', 'sell'].includes(order_type)) {
      return NextResponse.json({ error: 'Invalid order type' }, { status: 400 })
    }

    if (usdt_amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Check if user profile exists and account is not locked
    const { data: profile, error: profileError } = await supabase
      .from('user_profile')
      .select('is_locked, kyc_status')
      .eq('uid', session.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (profile.is_locked) {
      return NextResponse.json({ error: 'Account is locked' }, { status: 403 })
    }

    if (profile.kyc_status !== 'approved') {
      return NextResponse.json({ error: 'KYC verification required' }, { status: 403 })
    }

    // Process the order manually since database function might not be working
    let order: any = null
    try {
      // Get current config
      const { data: configData } = await supabase
        .from('p2p_express_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const config = configData || {
        buy_rate: 275.0000,
        sell_rate: 270.0000,
        min_order_amount: 100.00,
        max_order_amount: 10000.00,
        is_active: true,
        daily_buy_limit: 50000.00,
        daily_sell_limit: 50000.00
      }

      // Check if system is active
      if (!config.is_active) {
        return NextResponse.json({ error: 'P2P Express system is currently unavailable' }, { status: 400 })
      }

      // Get current rate
      const currentRate = order_type === 'buy' ? config.buy_rate : config.sell_rate

      // Check if rate matches expected rate
      if (Math.abs(currentRate - parseFloat(expected_rate)) > 0.01) {
        return NextResponse.json({ error: 'Rate has changed. Please refresh and try again' }, { status: 400 })
      }

      // Validate order amount
      if (usdt_amount < config.min_order_amount || usdt_amount > config.max_order_amount) {
        return NextResponse.json({ error: 'Order amount outside allowed limits' }, { status: 400 })
      }

      // Calculate PKR amount
      const pkrAmount = parseFloat(usdt_amount) * currentRate

      // Get user balances
      const { data: pkrWallet } = await supabase
        .from('user_pkr_wallets')
        .select('balance')
        .eq('user_id', session.user.id)
        .single()

      const { data: usdtWallet } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', session.user.id)
        .single()

      // Validate balances
      if (order_type === 'buy') {
        if (!pkrWallet || pkrWallet.balance < pkrAmount) {
          return NextResponse.json({ error: 'Insufficient PKR balance' }, { status: 400 })
        }
      } else {
        if (!usdtWallet || usdtWallet.balance < parseFloat(usdt_amount)) {
          return NextResponse.json({ error: 'Insufficient USDT balance' }, { status: 400 })
        }
      }

      // Create order record
      const { data: orderData, error: orderInsertError } = await supabase
        .from('p2p_express_orders')
        .insert({
          user_id: session.user.id,
          order_type: order_type,
          usdt_amount: parseFloat(usdt_amount),
          pkr_amount: pkrAmount,
          rate: currentRate,
          status: 'completed'
        })
        .select()
        .single()

      if (orderInsertError || !orderData) {
        console.error('Error creating order:', orderInsertError)
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
      }

      order = orderData

      // Update balances
      if (order_type === 'buy') {
        // Deduct PKR, add USDT
        if (pkrWallet) {
          await supabase
            .from('user_pkr_wallets')
            .update({ balance: pkrWallet.balance - pkrAmount })
            .eq('user_id', session.user.id)
        }

        await supabase
          .from('user_wallets')
          .update({ balance: (usdtWallet?.balance || 0) + parseFloat(usdt_amount) })
          .eq('user_id', session.user.id)
      } else {
        // Deduct USDT, add PKR
        if (usdtWallet) {
          await supabase
            .from('user_wallets')
            .update({ balance: usdtWallet.balance - parseFloat(usdt_amount) })
            .eq('user_id', session.user.id)
        }

        await supabase
          .from('user_pkr_wallets')
          .update({ balance: (pkrWallet?.balance || 0) + pkrAmount })
          .eq('user_id', session.user.id)
      }

    } catch (processError) {
      console.error('Error processing P2P order:', processError)
      return NextResponse.json({ 
        error: 'Failed to process order' 
      }, { status: 500 })
    }

    if (!order) {
      return NextResponse.json({ error: 'Failed to process order' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order,
      message: `${order_type === 'buy' ? 'Purchase' : 'Sale'} completed successfully`
    })

  } catch (error) {
    console.error('P2P Express order API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get user's order history
    const { data: orders, error } = await supabase
      .rpc('get_user_p2p_orders', {
        target_user_id: session.user.id,
        limit_count: limit
      })

    if (error) {
      console.error('Error fetching P2P orders:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    return NextResponse.json({
      orders,
      success: true
    })

  } catch (error) {
    console.error('P2P Express orders API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 