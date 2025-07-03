import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add admin role check

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const order_type = searchParams.get('order_type')
    const user_id = searchParams.get('user_id')

    const offset = (page - 1) * limit

    // Build query - we need to join manually since there's no direct foreign key
    let query = supabase
      .from('p2p_express_orders')
      .select(`
        *
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Add filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (order_type && order_type !== 'all') {
      query = query.eq('order_type', order_type)
    }

    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    const { data: orders, error: ordersError } = await query

    if (ordersError) {
      console.error('Error fetching P2P orders:', ordersError)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    // Fetch user profiles separately
    let ordersWithProfiles = orders || []
    if (orders && orders.length > 0) {
      const userIds = orders.map(order => order.user_id)
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profile')
        .select('uid, full_name, phone_number, kyc_status')
        .in('uid', userIds)

      if (!profilesError && profiles) {
        // Create a map for quick lookup
        const profileMap = new Map()
        profiles.forEach(profile => {
          profileMap.set(profile.uid, profile)
        })

        // Merge profiles with orders
        ordersWithProfiles = orders.map(order => ({
          ...order,
          user_profile: profileMap.get(order.user_id) || null
        }))
      }
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('p2p_express_orders')
      .select('id', { count: 'exact', head: true })

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status)
    }

    if (order_type && order_type !== 'all') {
      countQuery = countQuery.eq('order_type', order_type)
    }

    if (user_id) {
      countQuery = countQuery.eq('user_id', user_id)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error getting orders count:', countError)
      return NextResponse.json({ error: 'Failed to get orders count' }, { status: 500 })
    }

    // Get statistics
    const { data: stats, error: statsError } = await supabase
      .from('p2p_express_orders')
      .select(`
        order_type,
        status,
        usdt_amount,
        pkr_amount,
        created_at
      `)

    if (statsError) {
      console.error('Error fetching P2P stats:', statsError)
    }

    // Calculate statistics
    const statistics = {
      total_orders: count || 0,
      total_buy_orders: stats?.filter(o => o.order_type === 'buy').length || 0,
      total_sell_orders: stats?.filter(o => o.order_type === 'sell').length || 0,
      total_usdt_volume: stats?.reduce((sum, o) => sum + (parseFloat(o.usdt_amount) || 0), 0) || 0,
      total_pkr_volume: stats?.reduce((sum, o) => sum + (parseFloat(o.pkr_amount) || 0), 0) || 0,
      completed_orders: stats?.filter(o => o.status === 'completed').length || 0,
      pending_orders: stats?.filter(o => o.status === 'pending').length || 0,
      failed_orders: stats?.filter(o => o.status === 'failed').length || 0
    }

    return NextResponse.json({
      orders: ordersWithProfiles,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      },
      statistics,
      success: true
    })

  } catch (error) {
    console.error('Admin P2P Express orders API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 