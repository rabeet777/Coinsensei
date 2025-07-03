import 'dotenv/config'
import { config } from 'dotenv'
import * as cron from 'node-cron'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: '.env.local' })

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Function to trigger balance sync
async function triggerBalanceSync() {
  try {
    console.log(`[${new Date().toISOString()}] Starting balance sync cron job`)

    // Insert a sync job into job_logs table
    const jobId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const { error } = await supabaseAdmin
      .from('job_logs')
      .insert({
        job_id: jobId,
        job_type: 'sync',
        status: 'pending',
        triggered_by: 'schedule',
        data: { cron_triggered: true, timestamp: new Date().toISOString() }
      })

    if (error) {
      console.error(`[${new Date().toISOString()}] Failed to create sync job:`, error)
      return
    }

    console.log(`[${new Date().toISOString()}] Balance sync job created with ID: ${jobId}`)

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in balance sync cron:`, error)
  }
}

// Schedule cron job to run every 5 minutes
const cronJob = cron.schedule('*/5 * * * *', triggerBalanceSync, {
  timezone: 'UTC'
})

// Start the cron job
console.log(`[${new Date().toISOString()}] Starting balance sync cron job (every 5 minutes)`)

// Handle process termination
process.on('SIGTERM', () => {
  console.log(`[${new Date().toISOString()}] SIGTERM received, stopping cron job...`)
  cronJob.stop()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log(`[${new Date().toISOString()}] SIGINT received, stopping cron job...`)
  cronJob.stop()
  process.exit(0)
})

// Keep the process running
process.on('uncaughtException', (error) => {
  console.error(`[${new Date().toISOString()}] Uncaught exception:`, error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] Unhandled rejection at:`, promise, 'reason:', reason)
}) 