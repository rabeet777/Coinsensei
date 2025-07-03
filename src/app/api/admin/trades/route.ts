import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sortBy') || 'executed_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Calculate offset
    const offset = (page - 1) * limit

    // Build query for admin trades view
    let query = supabase
      .from('admin_trades_view')
      .select('*')

    // Apply filters
    if (status) {
      query = query.eq('trade_status', status)
    }

    if (startDate) {
      query = query.gte('executed_at', startDate)
    }

    if (endDate) {
      query = query.lte('executed_at', endDate)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: trades, error, count } = await query

    if (error) {
      console.error('Error fetching admin trades:', error)
      return NextResponse.json(
        { error: 'Failed to fetch trades' },
        { status: 500 }
      )
    }

    // Get summary statistics
    const { data: stats } = await supabase
      .from('trades')
      .select(`
        trade_amount.sum(),
        total_value.sum(),
        platform_fee_total.sum(),
        id.count()
      `)
      .eq('trade_status', 'completed')
      .single()

    const totalStats = {
      total_trades: (stats as any)?.count || 0,
      total_volume_usdt: (stats as any)?.sum?.trade_amount || 0,
      total_volume_pkr: (stats as any)?.sum?.total_value || 0,
      total_fees_collected: (stats as any)?.sum?.platform_fee_total || 0
    }

    return NextResponse.json({
      trades: trades || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats: totalStats
    })

  } catch (error) {
    console.error('Admin trades API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 