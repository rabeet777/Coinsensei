import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract query parameters
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')
    const job_type = searchParams.get('job_type')
    const worker_id = searchParams.get('worker_id')

    let query = supabase
      .from('job_logs')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    
    if (job_type) {
      query = query.eq('job_type', job_type)
    }
    
    if (worker_id) {
      query = query.eq('worker_id', worker_id)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: jobs, error, count } = await query

    if (error) {
      console.error('Error fetching jobs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch jobs', details: error.message },
        { status: 500 }
      )
    }

    // Get summary statistics
    const { data: summaryData } = await supabase
      .from('job_logs')
      .select('status')

    const summary = {
      total: summaryData?.length || 0,
      completed: summaryData?.filter(j => j.status === 'completed').length || 0,
      failed: summaryData?.filter(j => j.status === 'failed').length || 0,
      active: summaryData?.filter(j => j.status === 'active').length || 0,
      pending: summaryData?.filter(j => j.status === 'pending').length || 0,
    }

    return NextResponse.json({
      jobs: jobs || [],
      summary,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Unexpected error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 