import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
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

    const { action } = await request.json()

    if (!['start', 'pause'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Update system configuration
    const { error: configError } = await supabase
      .from('system_config')
      .upsert({
        key: 'workers_status',
        value: { status: action === 'start' ? 'active' : 'paused', updated_at: new Date().toISOString() },
        description: `Workers ${action === 'start' ? 'started' : 'paused'} by admin`
      }, { onConflict: 'key' })

    if (configError) throw configError

    // Log admin action
    await supabase
      .from('admin_actions')
      .insert({
        admin_user_id: session.user.id,
        action_type: `workers_${action}`,
        target_type: 'system',
        details: {
          action: action,
          timestamp: new Date().toISOString()
        }
      })

    // If using PM2, send signal to restart/pause workers
    if (process.env.NODE_ENV === 'production') {
      try {
        const { exec } = require('child_process')
        const command = action === 'start' 
          ? 'pm2 restart wallet-workers' 
          : 'pm2 stop wallet-workers'
        
        exec(command, (error: any, stdout: any, stderr: any) => {
          if (error) {
            console.error(`Worker control error: ${error}`)
          }
        })
      } catch (err) {
        console.error('PM2 control error:', err)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Workers ${action === 'start' ? 'started' : 'paused'} successfully` 
    })

  } catch (error: any) {
    console.error('Worker control error:', error)
    return NextResponse.json(
      { error: 'Failed to control workers' },
      { status: 500 }
    )
  }
} 