import 'dotenv/config'
import { config } from 'dotenv'
import * as cron from 'node-cron'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: '.env.local' })

// Constants
const CRON_INTERVAL_MINUTES = 5 // Run every 5 minutes
const MAX_JOBS_PER_BATCH = 20 // Limit jobs per batch to prevent overwhelming

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper function to create job if it doesn't exist
async function createJobIfNotExists(
  jobId: string, 
  jobType: string, 
  walletAddress: string, 
  userId: string, 
  additionalData: any = {}
): Promise<boolean> {
  try {
    // Check if job already exists (pending or active)
    const { data: existingJobs, error: checkError } = await supabaseAdmin
      .from('job_logs')
      .select('id')
      .eq('job_id', jobId)
      .in('status', ['pending', 'active'])

    if (checkError) {
      console.error(`[${new Date().toISOString()}] Error checking existing jobs:`, checkError)
      return false
    }

    if (existingJobs && existingJobs.length > 0) {
      console.log(`[${new Date().toISOString()}] Job ${jobId} already exists, skipping`)
      return false
    }

    // Create new job
    const { error: insertError } = await supabaseAdmin
      .from('job_logs')
      .insert({
        job_id: jobId,
        job_type: jobType,
        status: 'pending',
        wallet_address: walletAddress,
        user_id: userId,
        triggered_by: 'system',
        data: {
          cron_triggered: true,
          timestamp: new Date().toISOString(),
          ...additionalData
        }
      })

    if (insertError) {
      console.error(`[${new Date().toISOString()}] Error creating job ${jobId}:`, insertError)
      return false
    }

    console.log(`[${new Date().toISOString()}] Created ${jobType} job ${jobId} for wallet ${walletAddress}`)
    return true

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in createJobIfNotExists:`, error)
    return false
  }
}

// Helper function to get wallets needing jobs
async function getWalletsNeedingJobs() {
  try {
    const { data: wallets, error } = await supabaseAdmin
      .from('user_wallets')
      .select('user_id, address, needs_gas, needs_consolidation, trx_balance, on_chain_balance')
      .not('address', 'is', null)
      .or('needs_gas.eq.true,needs_consolidation.eq.true')
      .order('updated_at', { ascending: true })
      .limit(MAX_JOBS_PER_BATCH)

    if (error) {
      throw new Error(`Failed to fetch wallets: ${error.message}`)
    }

    return wallets || []

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching wallets:`, error)
    return []
  }
}

// Main function to queue dependent jobs
async function queueDependentJobs() {
  try {
    console.log(`[${new Date().toISOString()}] Starting dependent job queueing`)

    // Get wallets that need jobs
    const wallets = await getWalletsNeedingJobs()

    if (!wallets.length) {
      console.log(`[${new Date().toISOString()}] No wallets need jobs currently`)
      return
    }

    console.log(`[${new Date().toISOString()}] Found ${wallets.length} wallets needing jobs`)

    let gasTopupQueued = 0
    let consolidationQueued = 0
    let skipped = 0

    // Process each wallet according to dependency rules
    for (const wallet of wallets) {
      try {
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substr(2, 9)

        // Rule 1: If needs_gas is true → queue gas-topup job (skip consolidation)
        if (wallet.needs_gas) {
          const gasJobId = `gas-topup-${wallet.address}-${timestamp}`
          
          const created = await createJobIfNotExists(
            gasJobId,
            'gas-topup',
            wallet.address,
            wallet.user_id,
            {
              reason: 'insufficient_trx_balance',
              current_trx_balance: wallet.trx_balance,
              priority: 'high' // Gas is high priority
            }
          )

          if (created) {
            gasTopupQueued++
            console.log(`[${new Date().toISOString()}] Queued gas-topup for wallet ${wallet.address} (TRX: ${wallet.trx_balance})`)
          }

          // Skip consolidation for this wallet since it needs gas first
          if (wallet.needs_consolidation) {
            console.log(`[${new Date().toISOString()}] Skipping consolidation for wallet ${wallet.address} - needs gas first`)
          }

        } 
        // Rule 2: If needs_consolidation is true AND needs_gas is false → queue consolidation job
        else if (wallet.needs_consolidation && !wallet.needs_gas) {
          const consolidationJobId = `consolidation-${wallet.address}-${timestamp}`
          
          const created = await createJobIfNotExists(
            consolidationJobId,
            'consolidation',
            wallet.address,
            wallet.user_id,
            {
              reason: 'balance_above_threshold',
              current_usdt_balance: wallet.on_chain_balance,
              current_trx_balance: wallet.trx_balance,
              priority: 'normal'
            }
          )

          if (created) {
            consolidationQueued++
            console.log(`[${new Date().toISOString()}] Queued consolidation for wallet ${wallet.address} (USDT: ${wallet.on_chain_balance})`)
          }

        } else {
          // This shouldn't happen given our query, but log for debugging
          console.log(`[${new Date().toISOString()}] Wallet ${wallet.address} doesn't meet job criteria - skipping`)
          skipped++
        }

      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error processing wallet ${wallet.address}:`, error)
        skipped++
      }
    }

    console.log(`[${new Date().toISOString()}] Job queueing completed:`)
    console.log(`  - Gas top-up jobs queued: ${gasTopupQueued}`)
    console.log(`  - Consolidation jobs queued: ${consolidationQueued}`)
    console.log(`  - Wallets skipped: ${skipped}`)

    // Log summary to database
    const summaryJobId = `queue-summary-${Date.now()}`
    await supabaseAdmin
      .from('job_logs')
      .insert({
        job_id: summaryJobId,
        job_type: 'sync', // Using sync as closest match
        status: 'completed',
        triggered_by: 'system',
        data: {
          queue_summary: true,
          wallets_processed: wallets.length,
          gas_topup_queued: gasTopupQueued,
          consolidation_queued: consolidationQueued,
          skipped: skipped,
          timestamp: new Date().toISOString()
        },
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in dependent job queueing:`, error)
  }
}

// Function to get queue statistics
async function getQueueStats() {
  try {
    const { data: stats, error } = await supabaseAdmin
      .from('job_logs')
      .select('job_type, status')
      .in('status', ['pending', 'active'])

    if (error) {
      console.error(`[${new Date().toISOString()}] Error getting queue stats:`, error)
      return
    }

    const queueSummary = stats?.reduce((acc: any, job) => {
      if (!acc[job.job_type]) {
        acc[job.job_type] = { pending: 0, active: 0 }
      }
      acc[job.job_type][job.status]++
      return acc
    }, {})

    console.log(`[${new Date().toISOString()}] Current queue status:`, queueSummary)

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error getting queue statistics:`, error)
  }
}

// Main cron function
async function runQueueCron() {
  console.log(`[${new Date().toISOString()}] Running dependent job queue cron`)
  
  // Show current queue status
  await getQueueStats()
  
  // Queue new jobs based on wallet flags
  await queueDependentJobs()
}

// Schedule cron job to run every 5 minutes
const queueCronJob = cron.schedule(`*/${CRON_INTERVAL_MINUTES} * * * *`, runQueueCron, {
  timezone: 'UTC'
})

// Start the cron job
console.log(`[${new Date().toISOString()}] Starting dependent job queue cron (every ${CRON_INTERVAL_MINUTES} minutes)`)

// Handle process termination
process.on('SIGTERM', () => {
  console.log(`[${new Date().toISOString()}] SIGTERM received, stopping dependent job queue cron...`)
  queueCronJob.stop()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log(`[${new Date().toISOString()}] SIGINT received, stopping dependent job queue cron...`)
  queueCronJob.stop()
  process.exit(0)
})

// Keep the process running
process.on('uncaughtException', (error) => {
  console.error(`[${new Date().toISOString()}] Uncaught exception in dependent job queue cron:`, error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] Unhandled rejection in dependent job queue cron at:`, promise, 'reason:', reason)
})

// Run initial queue check on startup
setTimeout(runQueueCron, 10000) // Wait 10 seconds after startup 