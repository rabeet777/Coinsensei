import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const userId = searchParams.get('userId')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Calculate offset
    const offset = (page - 1) * limit

    // Build query without the problematic auth.users join
    let query = supabase
      .from('orders')
      .select('*')

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: orders, error, count } = await query

    if (error) {
      console.error('Error fetching admin orders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    // Get user profiles separately for the orders
    const userIds = orders?.map(order => order.user_id).filter(Boolean) || []
    let userProfiles: any[] = []
    
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profile')
        .select('uid, full_name, phone_number')
        .in('uid', userIds)

      if (!profilesError && profilesData) {
        userProfiles = profilesData
      }
    }

    // Create user profile map
    const profileMap = new Map()
    userProfiles.forEach(profile => {
      profileMap.set(profile.uid, profile)
    })

    // Combine orders with user profiles
    const ordersWithUsers = orders?.map(order => ({
      ...order,
      user_profile: profileMap.get(order.user_id) || null
    })) || []

    // Get summary statistics
    const { data: orderStats } = await supabase
      .from('orders')
      .select(`
        amount.sum(),
        price.avg(),
        fee_amount.sum(),
        id.count()
      `)

    // Get status breakdown using separate queries
    const { count: pendingCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { count: executedCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'executed')

    const { count: cancelledCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cancelled')

    const summaryStats = {
      total_orders: (orderStats as any)?.count || 0,
      total_volume: (orderStats as any)?.sum?.amount || 0,
      average_price: (orderStats as any)?.avg?.price || 0,
      total_fees: (orderStats as any)?.sum?.fee_amount || 0,
      status_breakdown: {
        pending: pendingCount || 0,
        executed: executedCount || 0,
        cancelled: cancelledCount || 0
      }
    }

    return NextResponse.json({
      orders: ordersWithUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats: summaryStats
    })

  } catch (error) {
    console.error('Admin orders API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 