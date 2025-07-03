import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'

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

    const { walletId, userId, address, jobType } = await request.json()

    if (!walletId || !userId || !address || !jobType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['consolidation', 'gas-topup'].includes(jobType)) {
      return NextResponse.json({ error: 'Invalid job type' }, { status: 400 })
    }

    // Check if wallet exists and is not already being processed
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('id, address, balance, is_processing')
      .eq('id', walletId)
      .eq('address', address)
      .single()

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    if (wallet.is_processing) {
      return NextResponse.json({ error: 'Wallet is already being processed' }, { status: 409 })
    }

    // Generate unique job ID
    const jobId = uuidv4()

    // Prepare job data based on type
    const jobData: Record<string, unknown> = {
      wallet_id: walletId,
      user_id: userId,
      address: address,
      initiated_by: 'admin',
      admin_user_id: session.user.id
    }

    if (jobType === 'consolidation') {
      jobData.consolidation_type = 'manual'
      jobData.reason = 'Admin initiated consolidation'
    } else if (jobType === 'gas-topup') {
      jobData.topup_amount = '10' // Default 10 TRX
      jobData.reason = 'Admin initiated gas topup'
    }

    // Insert job into queue
    const { error: jobError } = await supabase
      .from('job_logs')
      .insert({
        job_id: jobId,
        job_type: jobType,
        status: 'pending',
        wallet_address: address,
        user_id: userId,
        data: jobData,
        retry_count: 0,
        max_retries: 3,
        created_at: new Date().toISOString()
      })

    if (jobError) throw jobError

    // Mark wallet as processing
    const { error: updateError } = await supabase
      .from('user_wallets')
      .update({ 
        is_processing: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', walletId)

    if (updateError) {
      console.error('Failed to mark wallet as processing:', updateError)
    }

    // Log admin action
    await supabase
      .from('admin_actions')
      .insert({
        admin_user_id: session.user.id,
        action_type: `dispatch_${jobType}`,
        target_id: walletId,
        target_type: 'wallet',
        details: {
          job_id: jobId,
          job_type: jobType,
          wallet_address: address,
          user_id: userId,
          timestamp: new Date().toISOString()
        }
      })

    // If using Redis/Queue system, add job to queue
    try {
      // This would integrate with your actual job queue system
      // For now, we'll simulate by updating the job status
      console.log(`Job ${jobId} (${jobType}) queued for wallet ${address}`)
      
      // In a real implementation, you might use:
      // await jobQueue.add(jobType, jobData, { delay: 0, priority: 10 })
      
    } catch (queueError) {
      console.error('Failed to add job to queue:', queueError)
    }

    return NextResponse.json({ 
      success: true, 
      jobId: jobId,
      message: `${jobType.replace('-', ' ')} job queued successfully for wallet ${address.slice(0, 8)}...` 
    })

  } catch (error: any) {
    console.error('Job dispatch error:', error)
    return NextResponse.json(
      { error: 'Failed to dispatch job' },
      { status: 500 }
    )
  }
} 