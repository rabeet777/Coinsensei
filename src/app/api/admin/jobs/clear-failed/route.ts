import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(_request: NextRequest) {
  try {
    // Handle cookies properly for Next.js 15+ compatibility
    const cookiesStore = cookies
    const supabase = createRouteHandlerClient({ cookies: cookiesStore })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profile')
      .select('role')
      .eq('uid', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get count of failed jobs before deletion
    const { count: failedCount } = await supabase
      .from('job_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')

    // Clear failed jobs (mark as cancelled instead of deleting)
    const { error: updateError } = await supabase
      .from('job_logs')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString(),
        error_message: 'Cleared by admin'
      })
      .eq('status', 'failed')

    if (updateError) throw updateError

    // Reset any stuck processing states for failed jobs
    const { data: cancelledJobs } = await supabase
      .from('job_logs')
      .select('data')
      .eq('status', 'cancelled')

    const walletIds = cancelledJobs?.map(job => {
      const data = job.data as any
      return data?.wallet_id
    }).filter(Boolean) || []

    if (walletIds.length > 0) {
      const { error: resetError } = await supabase
        .from('user_wallets')
        .update({ 
          is_processing: false,
          updated_at: new Date().toISOString()
        })
        .in('id', walletIds)

      if (resetError) {
        console.error('Failed to reset processing states:', resetError)
      }
    }

    // Log admin action
    await supabase
      .from('admin_actions')
      .insert({
        admin_user_id: session.user.id,
        action_type: 'clear_failed_jobs',
        target_type: 'system',
        details: {
          jobs_cleared: failedCount || 0,
          timestamp: new Date().toISOString()
        }
      })

    return NextResponse.json({ 
      success: true, 
      message: `${failedCount || 0} failed jobs cleared successfully`,
      cleared_count: failedCount || 0
    })

  } catch (error: any) {
    console.error('Clear failed jobs error:', error)
    return NextResponse.json(
      { error: 'Failed to clear failed jobs' },
      { status: 500 }
    )
  }
} 