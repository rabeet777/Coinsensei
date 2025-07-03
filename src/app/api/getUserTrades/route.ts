import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Calculate offset
    const offset = (page - 1) * limit

    // Build query for user trades
    let query = supabase
      .from('user_trades_view')
      .select('*')
      .eq('buyer_user_id', userId)
      .or(`seller_user_id.eq.${userId}`)

    // Apply date filters
    if (startDate) {
      query = query.gte('executed_at', startDate)
    }

    if (endDate) {
      query = query.lte('executed_at', endDate)
    }

    // Apply sorting and pagination
    query = query
      .order('executed_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: trades, error, count } = await query

    if (error) {
      console.error('Error fetching user trades:', error)
      return NextResponse.json(
        { error: 'Failed to fetch trades' },
        { status: 500 }
      )
    }

    // Get user trade statistics
    const { data: userStats } = await supabase
      .from('trades')
      .select(`
        trade_amount.sum(),
        total_value.sum(),
        buyer_fee.sum(),
        seller_fee.sum(),
        id.count()
      `)
      .or(`buyer_user_id.eq.${userId},seller_user_id.eq.${userId}`)
      .eq('trade_status', 'completed')
      .single()

    const userTradeStats = {
      total_trades: (userStats as any)?.count || 0,
      total_volume_usdt: (userStats as any)?.sum?.trade_amount || 0,
      total_volume_pkr: (userStats as any)?.sum?.total_value || 0,
      total_fees_paid: ((userStats as any)?.sum?.buyer_fee || 0) + ((userStats as any)?.sum?.seller_fee || 0)
    }

    return NextResponse.json({
      trades: trades || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats: userTradeStats
    })

  } catch (error) {
    console.error('User trades API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 