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

    // Get count of stuck processing wallets
    const { data: stuckWallets, count: stuckCount } = await supabase
      .from('user_wallets')
      .select('id, address', { count: 'exact' })
      .eq('is_processing', true)

    // Reset all processing states
    const { error: resetError } = await supabase
      .from('user_wallets')
      .update({ 
        is_processing: false,
        updated_at: new Date().toISOString()
      })
      .eq('is_processing', true)

    if (resetError) throw resetError

    // Also reset any stuck pending/processing jobs older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data: stuckJobs, count: jobCount } = await supabase
      .from('job_logs')
      .select('id, job_id, job_type', { count: 'exact' })
      .in('status', ['pending', 'processing'])
      .lt('created_at', oneHourAgo)

    if (stuckJobs && stuckJobs.length > 0) {
      const { error: jobResetError } = await supabase
        .from('job_logs')
        .update({ 
          status: 'failed',
          error_message: 'Job reset by admin - stuck in processing state',
          updated_at: new Date().toISOString()
        })
        .in('id', stuckJobs.map(job => job.id))

      if (jobResetError) {
        console.error('Failed to reset stuck jobs:', jobResetError)
      }
    }

    // Reset any consolidation/gas flags that might be stuck
    const { error: flagResetError } = await supabase
      .from('user_wallets')
      .update({ 
        needs_consolidation: false,
        needs_gas: false,
        updated_at: new Date().toISOString()
      })
      .eq('is_processing', false) // Only for wallets we just reset

    if (flagResetError) {
      console.error('Failed to reset flags:', flagResetError)
    }

    // Log admin action
    await supabase
      .from('admin_actions')
      .insert({
        admin_user_id: session.user.id,
        action_type: 'reset_processing_states',
        target_type: 'system',
        details: {
          wallets_reset: stuckCount || 0,
          jobs_reset: jobCount || 0,
          reset_wallets: stuckWallets?.map(w => w.address) || [],
          timestamp: new Date().toISOString()
        }
      })

    return NextResponse.json({ 
      success: true, 
      message: `Reset completed: ${stuckCount || 0} wallets and ${jobCount || 0} stuck jobs`,
      wallets_reset: stuckCount || 0,
      jobs_reset: jobCount || 0
    })

  } catch (error: any) {
    console.error('Reset processing states error:', error)
    return NextResponse.json(
      { error: 'Failed to reset processing states' },
      { status: 500 }
    )
  }
} 