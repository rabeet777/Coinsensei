import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Redis client for system state management
let redis: Redis | null = null
try {
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
      lazyConnect: true
    })
  }
} catch (err) {
  console.error('Failed to initialize Redis:', err)
}

export async function POST(request: NextRequest) {
  try {
    const { action, adminUserId, reason } = await request.json()

    if (!action) {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      )
    }

    const validActions = ['pause', 'resume']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be pause or resume' },
        { status: 400 }
      )
    }

    console.log(`🎛️ Admin system control: ${action} withdrawal system`)

    // System state management
    const systemKey = 'withdrawal_system_status'
    const currentTimestamp = new Date().toISOString()

    let systemStatus = {
      status: action === 'pause' ? 'paused' : 'active',
      paused_at: action === 'pause' ? currentTimestamp : null,
      resumed_at: action === 'resume' ? currentTimestamp : null,
      paused_by: action === 'pause' ? (adminUserId || 'system') : null,
      reason: action === 'pause' ? (reason || 'Emergency pause by admin') : null,
      updated_at: currentTimestamp
    }

    // Store system status in Redis if available
    if (redis) {
      try {
        await redis.setex(systemKey, 3600, JSON.stringify(systemStatus)) // Expires in 1 hour
        console.log(`💾 System status stored in Redis: ${action}`)
      } catch (redisError) {
        console.error('Failed to store in Redis:', redisError)
        // Continue without Redis
      }
    }

    // Store system status in database
    try {
      const { data: existingStatus, error: fetchError } = await supabaseAdmin
        .from('system_config')
        .select('*')
        .eq('key', 'withdrawal_system_status')
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (existingStatus) {
        // Update existing record
        const { error: updateError } = await supabaseAdmin
          .from('system_config')
          .update({
            value: systemStatus,
            updated_at: currentTimestamp
          })
          .eq('key', 'withdrawal_system_status')

        if (updateError) throw updateError
      } else {
        // Insert new record
        const { error: insertError } = await supabaseAdmin
          .from('system_config')
          .insert({
            key: 'withdrawal_system_status',
            value: systemStatus,
            created_at: currentTimestamp,
            updated_at: currentTimestamp
          })

        if (insertError) throw insertError
      }
    } catch (dbError) {
      console.error('Failed to store system status in database:', dbError)
      // Continue without database storage
    }

    if (action === 'pause') {
      console.log('🛑 Withdrawal system PAUSED')
      
      // Optionally pause ongoing withdrawals (set them back to pending)
      try {
        const { data: processingWithdrawals, error: pauseError } = await supabaseAdmin
          .from('withdrawals')
          .update({
            status: 'pending',
            error_message: 'Paused by admin - will resume automatically',
            updated_at: currentTimestamp
          })
          .eq('status', 'processing')
          .select('id')

        if (pauseError) {
          console.error('Failed to pause processing withdrawals:', pauseError)
        } else {
          console.log(`⏸️ Paused ${processingWithdrawals?.length || 0} processing withdrawals`)
        }
      } catch (err) {
        console.error('Error pausing withdrawals:', err)
      }

      // Send alerts to admin team
      try {
        await sendSystemAlert('pause', {
          adminUserId: adminUserId || 'system',
          reason: reason || 'Emergency pause',
          timestamp: currentTimestamp
        })
      } catch (alertError) {
        console.error('Failed to send pause alert:', alertError)
      }

    } else if (action === 'resume') {
      console.log('✅ Withdrawal system RESUMED')
      
      // Optionally auto-approve paused withdrawals
      try {
        const { data: pausedWithdrawals, error: resumeError } = await supabaseAdmin
          .from('withdrawals')
          .select('id, type')
          .eq('status', 'pending')
          .contains('error_message', 'Paused by admin')

        if (resumeError) {
          console.error('Failed to fetch paused withdrawals:', resumeError)
        } else if (pausedWithdrawals && pausedWithdrawals.length > 0) {
          // Clear pause error messages
          await supabaseAdmin
            .from('withdrawals')
            .update({
              error_message: null,
              updated_at: currentTimestamp
            })
            .contains('error_message', 'Paused by admin')

          console.log(`▶️ Cleared pause status from ${pausedWithdrawals.length} withdrawals`)
        }
      } catch (err) {
        console.error('Error resuming withdrawals:', err)
      }

      // Send resume notification
      try {
        await sendSystemAlert('resume', {
          adminUserId: adminUserId || 'system',
          timestamp: currentTimestamp
        })
      } catch (alertError) {
        console.error('Failed to send resume alert:', alertError)
      }
    }

    // Log admin action for audit trail
    try {
      await supabaseAdmin
        .from('admin_actions')
        .insert({
          admin_user_id: adminUserId || 'system',
          action_type: 'system_' + action,
          target_id: 'withdrawal_system',
          target_type: 'system',
          details: {
            action: action,
            reason: reason,
            system_status: systemStatus,
            timestamp: currentTimestamp
          },
          created_at: currentTimestamp
        })
    } catch (auditError) {
      console.error('Failed to log admin action:', auditError)
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json({
      success: true,
      message: `Withdrawal system ${action}d successfully`,
      action,
      systemStatus,
      timestamp: currentTimestamp
    })

  } catch (error) {
    console.error('❌ System control failed:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// Get current system status
export async function GET(_request: NextRequest) {
  try {
          let systemStatus = null

    // Try Redis first
    if (redis) {
      try {
        const redisStatus = await redis.get('withdrawal_system_status')
        if (redisStatus) {
          systemStatus = JSON.parse(redisStatus)
        }
      } catch (redisError) {
        console.error('Failed to get status from Redis:', redisError)
      }
    }

    // Fall back to database
    if (!systemStatus) {
      try {
        const { data: dbStatus, error: dbError } = await supabaseAdmin
          .from('system_config')
          .select('value')
          .eq('key', 'withdrawal_system_status')
          .single()

        if (dbError && dbError.code !== 'PGRST116') {
          throw dbError
        }

        systemStatus = dbStatus?.value || {
          status: 'active',
          paused_at: null,
          resumed_at: null,
          paused_by: null,
          reason: null,
          updated_at: new Date().toISOString()
        }
      } catch (err) {
        console.error('Failed to get status from database:', err)
        systemStatus = {
          status: 'active',
          paused_at: null,
          resumed_at: null,
          paused_by: null,
          reason: null,
          updated_at: new Date().toISOString()
        }
      }
    }

    return NextResponse.json({
      success: true,
      systemStatus
    })

  } catch (error) {
    console.error('❌ Failed to get system status:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// Helper function to send system alerts
async function sendSystemAlert(action: 'pause' | 'resume', data: any) {
  // Implementation would depend on your notification system
  // Examples: Slack webhook, Discord, email, SMS, etc.
  
  const message = action === 'pause' 
    ? `🛑 WITHDRAWAL SYSTEM PAUSED by ${data.adminUserId}\nReason: ${data.reason}\nTime: ${data.timestamp}`
    : `✅ WITHDRAWAL SYSTEM RESUMED by ${data.adminUserId}\nTime: ${data.timestamp}`

  console.log(`📢 System Alert: ${message}`)
  
  // Example Slack webhook (replace with your actual webhook URL)
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          channel: '#alerts',
          username: 'CoinSensei Bot',
          icon_emoji: action === 'pause' ? ':warning:' : ':white_check_mark:'
        })
      })
    } catch (err) {
      console.error('Failed to send Slack alert:', err)
    }
  }

  // Example Discord webhook
  if (process.env.DISCORD_WEBHOOK_URL) {
    try {
      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message,
          username: 'CoinSensei Bot'
        })
      })
    } catch (err) {
      console.error('Failed to send Discord alert:', err)
    }
  }
} 