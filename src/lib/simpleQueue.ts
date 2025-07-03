// Simple job queue implementation to avoid BullMQ version conflicts
import { createClient } from '@supabase/supabase-js'

// ✅ FIXED: Lazy-load Supabase client to ensure env vars are available
let supabaseAdmin: any = null

function getSupabaseClient() {
  if (!supabaseAdmin) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    }
    
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }
  return supabaseAdmin
}

// Simple job queue using database table
export async function addWithdrawalJobSimple(data: {
  withdrawalId: number
  user_id: string
  to_address: string
  amount: number
  fee: number
}) {
  try {
    const supabase = getSupabaseClient()
    
    // Insert job into database table
    const { data: job, error } = await supabase
      .from('withdrawal_jobs')
      .insert([{
        withdrawal_id: data.withdrawalId,
        user_id: data.user_id,
        to_address: data.to_address,
        amount: data.amount,
        fee: data.fee,
        status: 'pending',
        attempts: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select('id')
      .single()

    if (error) {
      throw error
    }

    console.log('✅ Withdrawal job added to simple queue:', job.id)
    return job.id
  } catch (error) {
    console.error('❌ Failed to add withdrawal job to simple queue:', error)
    throw error
  }
}

// Get pending jobs (for worker processing)
export async function getPendingWithdrawalJobs(limit = 10) {
  try {
    const supabase = getSupabaseClient()
    
    const { data: jobs, error } = await supabase
      .from('withdrawal_jobs')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      throw error
    }

    return jobs || []
  } catch (error) {
    console.error('❌ Failed to get pending withdrawal jobs:', error)
    return []
  }
}

// Mark job as processing
export async function markJobAsProcessing(jobId: number) {
  try {
    const supabase = getSupabaseClient()
    
    const { error } = await supabase
      .from('withdrawal_jobs')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error('❌ Failed to mark job as processing:', error)
    return false
  }
}

// Mark job as completed
export async function markJobAsCompleted(jobId: number, txHash?: string) {
  try {
    const supabase = getSupabaseClient()
    
    const { error } = await supabase
      .from('withdrawal_jobs')
      .update({
        status: 'completed',
        tx_hash: txHash,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error('❌ Failed to mark job as completed:', error)
    return false
  }
}

// Mark job as failed
export async function markJobAsFailed(jobId: number, errorMessage: string) {
  try {
    const supabase = getSupabaseClient()
    
    // First get current attempts count
    const { data: currentJob } = await supabase
      .from('withdrawal_jobs')
      .select('attempts')
      .eq('id', jobId)
      .single()

    const newAttempts = (currentJob?.attempts || 0) + 1

    const { error } = await supabase
      .from('withdrawal_jobs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        attempts: newAttempts,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error('❌ Failed to mark job as failed:', error)
    return false
  }
} 