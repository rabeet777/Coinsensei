import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { consolidationQueue } from '@/lib/queues'

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    let userId: string | undefined = undefined
    try {
      const body = await request.json()
      userId = body.userId
    } catch {
      // No JSON body or invalid JSON, treat as global consolidation
      userId = undefined
    }

    if (userId) {
      // Per-user consolidation job
      // First, check if the user exists and has a wallet
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('user_wallets')
        .select('address, on_chain_balance')
        .eq('user_id', userId)
        .single()

      if (walletError) {
        console.error('Error fetching wallet:', walletError)
        return NextResponse.json(
          { error: 'Failed to fetch user wallet' },
          { status: 500 }
        )
      }

      if (!wallet) {
        return NextResponse.json(
          { error: 'User wallet not found' },
          { status: 404 }
        )
      }

      // Add job to consolidation queue for a specific user
      const job = await consolidationQueue.add('consolidate', {
        userId,
        walletAddress: wallet.address,
        onChainBalance: wallet.on_chain_balance
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      })

      return NextResponse.json({ 
        message: 'Consolidation job queued successfully',
        jobId: job.id,
        jobDetails: {
          name: job.name,
          data: job.data,
          timestamp: job.timestamp
        }
      })
    } else {
      // Global consolidation job (no userId)
      const job = await consolidationQueue.add('consolidate', {
        global: true
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      })
      return NextResponse.json({
        message: 'Global consolidation job queued successfully',
        jobId: job.id,
        jobDetails: {
          name: job.name,
          data: job.data,
          timestamp: job.timestamp
        }
      })
    }
  } catch (error) {
    console.error('Error in consolidation endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
} 