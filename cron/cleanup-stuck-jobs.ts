import 'dotenv/config'
import { config } from 'dotenv'
import * as cron from 'node-cron'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: '.env.local' })

// Constants
const STUCK_THRESHOLD_MINUTES = 10 // Jobs stuck for more than 10 minutes
const CLEANUP_INTERVAL_MINUTES = 10 // Run cleanup every 10 minutes

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Function to cleanup stuck jobs
async function cleanupStuckJobs() {
  try {
    console.log(`[${new Date().toISOString()}] Starting stuck jobs cleanup`)

    // Calculate the cutoff time (10 minutes ago)
    const cutoffTime = new Date(Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000).toISOString()

    // Find jobs that are stuck in 'active' state for more than 10 minutes
    const { data: stuckJobs, error: fetchError } = await supabaseAdmin
      .from('job_logs')
      .select('id, job_id, job_type, started_at, wallet_address, user_id')
      .eq('status', 'active')
      .lt('started_at', cutoffTime)

    if (fetchError) {
      console.error(`[${new Date().toISOString()}] Error fetching stuck jobs:`, fetchError)
      return
    }

    if (!stuckJobs || stuckJobs.length === 0) {
      console.log(`[${new Date().toISOString()}] No stuck jobs found`)
      return
    }

    console.log(`[${new Date().toISOString()}] Found ${stuckJobs.length} stuck jobs to cleanup`)

    let cleanedUp = 0
    let errors = 0

    // Process each stuck job
    for (const job of stuckJobs) {
      try {
        console.log(`[${new Date().toISOString()}] Cleaning up stuck job ${job.job_id} (${job.job_type}) started at ${job.started_at}`)

        // Update job status to failed
        const { error: updateError } = await supabaseAdmin
          .from('job_logs')
          .update({
            status: 'failed',
            error_message: `Job stuck in active state for more than ${STUCK_THRESHOLD_MINUTES} minutes. Marked as failed by cleanup process.`,
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id)
          .eq('status', 'active') // Double-check it's still active

        if (updateError) {
          console.error(`[${new Date().toISOString()}] Failed to update stuck job ${job.job_id}:`, updateError)
          errors++
          continue
        }

        // Reset wallet flags if applicable
        if (job.wallet_address) {
          try {
            if (job.job_type === 'gas-topup') {
              // For gas-topup jobs, set needs_gas back to true so it can be retried
              await supabaseAdmin
                .from('user_wallets')
                .update({ needs_gas: true })
                .eq('address', job.wallet_address)
              
              console.log(`[${new Date().toISOString()}] Reset needs_gas flag for wallet ${job.wallet_address}`)
            } else if (job.job_type === 'consolidation') {
              // For consolidation jobs, keep needs_consolidation true for retry
              console.log(`[${new Date().toISOString()}] Keeping consolidation flag for wallet ${job.wallet_address}`)
            }
          } catch (walletError) {
            console.error(`[${new Date().toISOString()}] Failed to reset wallet flags for ${job.wallet_address}:`, walletError)
          }
        }

        cleanedUp++
        console.log(`[${new Date().toISOString()}] Successfully cleaned up stuck job ${job.job_id}`)

      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error cleaning up job ${job.job_id}:`, error)
        errors++
      }
    }

    console.log(`[${new Date().toISOString()}] Cleanup completed. Cleaned up: ${cleanedUp}, Errors: ${errors}`)

    // Log cleanup summary
    const { error: logError } = await supabaseAdmin
      .from('job_logs')
      .insert({
        job_id: `cleanup-${Date.now()}`,
        job_type: 'sync', // Using sync as closest match for maintenance
        status: 'completed',
        triggered_by: 'system',
        data: { 
          cleanup_summary: true,
          stuck_jobs_found: stuckJobs.length,
          cleaned_up: cleanedUp,
          errors: errors,
          cutoff_time: cutoffTime,
          threshold_minutes: STUCK_THRESHOLD_MINUTES
        },
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })

    if (logError) {
      console.error(`[${new Date().toISOString()}] Failed to log cleanup summary:`, logError)
    }

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in cleanup process:`, error)
  }
}

// Function to cleanup old completed jobs (optional - prevents table bloat)
async function cleanupOldJobs() {
  try {
    // Remove completed jobs older than 7 days
    const cutoffTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: deletedJobs, error } = await supabaseAdmin
      .from('job_logs')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('completed_at', cutoffTime)
      .select('id')

    if (error) {
      console.error(`[${new Date().toISOString()}] Error cleaning up old jobs:`, error)
      return
    }

    if (deletedJobs && deletedJobs.length > 0) {
      console.log(`[${new Date().toISOString()}] Cleaned up ${deletedJobs.length} old completed/failed jobs`)
    }

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in old jobs cleanup:`, error)
  }
}

// Main cleanup function
async function runCleanup() {
  console.log(`[${new Date().toISOString()}] Running scheduled cleanup`)
  
  await cleanupStuckJobs()
  
  // Run old jobs cleanup once per day (when minutes is 0)
  const now = new Date()
  if (now.getMinutes() === 0) {
    await cleanupOldJobs()
  }
}

// Schedule cleanup job to run every 10 minutes
const cleanupJob = cron.schedule(`*/${CLEANUP_INTERVAL_MINUTES} * * * *`, runCleanup, {
  timezone: 'UTC'
})

// Start the cleanup job
console.log(`[${new Date().toISOString()}] Starting job cleanup cron (every ${CLEANUP_INTERVAL_MINUTES} minutes)`)

// Handle process termination
process.on('SIGTERM', () => {
  console.log(`[${new Date().toISOString()}] SIGTERM received, stopping cleanup cron...`)
  cleanupJob.stop()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log(`[${new Date().toISOString()}] SIGINT received, stopping cleanup cron...`)
  cleanupJob.stop()
  process.exit(0)
})

// Keep the process running
process.on('uncaughtException', (error) => {
  console.error(`[${new Date().toISOString()}] Uncaught exception in cleanup:`, error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] Unhandled rejection in cleanup at:`, promise, 'reason:', reason)
})

// Run initial cleanup on startup
setTimeout(runCleanup, 5000) // Wait 5 seconds after startup 