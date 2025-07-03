import 'dotenv/config'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { getTronWeb, deriveTronAccount } from '../src/lib/tronWallet'
import TronWeb from 'tronweb'

// Load environment variables from .env.local
config({ path: '.env.local' })

// Constants
const MIN_TRX_BALANCE = 1 * 1e6 // 1 TRX in sun
const TOPUP_AMOUNT = 5 * 1e6 // 5 TRX in sun  
const POLL_INTERVAL = 5000 // 5 seconds
const MAX_RETRIES = 3
const RATE_LIMIT_MINUTES = 10 // Don't send TRX to same wallet more than once every 10 mins

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Rate limiting tracker (in production, use Redis or database)
const rateLimitTracker = new Map<string, number>()

// Helper function to format address
function formatAddress(tronWeb: any, address: string): string {
  try {
    if (address.startsWith('41')) {
      return (tronWeb as any).address.fromHex(address)
    }
    if (!(tronWeb as any).isAddress(address)) {
      throw new Error(`Invalid address: ${address}`)
    }
    return address
  } catch (error: any) {
    throw new Error(`Failed to format address ${address}: ${error.message}`)
  }
}

// Helper function to check if wallet is rate limited
function isRateLimited(walletAddress: string): boolean {
  const lastSent = rateLimitTracker.get(walletAddress)
  if (!lastSent) return false
  
  const timeDiff = Date.now() - lastSent
  const rateLimitMs = RATE_LIMIT_MINUTES * 60 * 1000
  
  return timeDiff < rateLimitMs
}

// Helper function to update rate limit
function updateRateLimit(walletAddress: string) {
  rateLimitTracker.set(walletAddress, Date.now())
}

// Helper function to check TRX balance
async function checkTRXBalance(tronWeb: any, address: string): Promise<number> {
  try {
    const balance = await (tronWeb as any).trx.getBalance(address)
    return balance
  } catch (error) {
    console.error(`Failed to get TRX balance for ${address}:`, error)
    return 0
  }
}

// Helper function to send TRX
async function sendTRX(
  tronWeb: any,
  fromAddress: string,
  fromPrivateKey: string,
  toAddress: string,
  amount: number
): Promise<string> {
  try {
    const formattedFromAddress = formatAddress(tronWeb, fromAddress)
    const formattedToAddress = formatAddress(tronWeb, toAddress)

    console.log(`[${new Date().toISOString()}] Sending ${amount / 1e6} TRX from ${formattedFromAddress} to ${formattedToAddress}`)

    const tx = await (tronWeb as any).trx.sendTransaction(formattedToAddress, amount, fromPrivateKey)
    
    console.log(`[${new Date().toISOString()}] TRX transfer successful: ${tx.txid}`)
    return tx.txid
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] TRX transfer failed:`, error)
    throw error
  }
}

// Main gas topup function
async function processGasTopup(job: any) {
  const startTime = Date.now()
  console.log(`[${new Date().toISOString()}] Processing gas topup job ${job.job_id}`)

  try {
    const { wallet_address: walletAddress, user_id: userId } = job
    
    if (!walletAddress) {
      throw new Error('Wallet address not provided in job data')
    }

    // Check rate limiting
    if (isRateLimited(walletAddress)) {
      const lastSent = rateLimitTracker.get(walletAddress)
      const timeLeft = RATE_LIMIT_MINUTES * 60 * 1000 - (Date.now() - lastSent!)
      throw new Error(`Rate limited: ${(timeLeft / 60000).toFixed(1)} minutes remaining`)
    }

    // Check if another active job exists for this wallet
    const { data: activeJobs, error: activeJobsError } = await supabaseAdmin
      .from('job_logs')
      .select('id')
      .eq('wallet_address', walletAddress)
      .eq('job_type', 'gas-topup')
      .eq('status', 'active')
      .neq('id', job.id)

    if (activeJobsError) {
      throw new Error(`Failed to check active jobs: ${activeJobsError.message}`)
    }

    if (activeJobs && activeJobs.length > 0) {
      throw new Error('Another gas topup job is already active for this wallet')
    }

    // Get TronWeb instance
    const tronWeb = await getTronWeb()
    
    // Initialize with admin account
    const adminAccount = await deriveTronAccount(0)
    const adminAddress = formatAddress(tronWeb, adminAccount.address)
    ;(tronWeb as any).setAddress(adminAddress)
    ;(tronWeb as any).setPrivateKey(adminAccount.privateKey)

    // Check admin balance
    const adminBalance = await checkTRXBalance(tronWeb, adminAddress)
    if (adminBalance < TOPUP_AMOUNT) {
      throw new Error(`Admin account has insufficient TRX balance: ${adminBalance / 1e6} TRX`)
    }

    // Check current wallet balance
    const currentBalance = await checkTRXBalance(tronWeb, walletAddress)
    console.log(`[${new Date().toISOString()}] Wallet ${walletAddress} has ${currentBalance / 1e6} TRX`)

    if (currentBalance >= MIN_TRX_BALANCE) {
      // Update rate limit to prevent unnecessary top-ups
      updateRateLimit(walletAddress)
      
      // Update wallet flags
      await supabaseAdmin
        .from('user_wallets')
        .update({ needs_gas: false })
        .eq('address', walletAddress)

      return {
        txid: null,
        message: 'Wallet already has sufficient TRX balance',
        currentBalance: currentBalance / 1e6,
        skipped: true
      }
    }

    // Send TRX to user wallet
    const txid = await sendTRX(
      tronWeb,
      adminAddress,
      adminAccount.privateKey,
      walletAddress,
      TOPUP_AMOUNT
    )

    // Update rate limit
    updateRateLimit(walletAddress)

    // Update wallet flags
    await supabaseAdmin
      .from('user_wallets')
      .update({ needs_gas: false })
      .eq('address', walletAddress)

    const duration = Date.now() - startTime
    console.log(`[${new Date().toISOString()}] Gas topup completed in ${duration}ms for wallet ${walletAddress}`)

    return {
      txid,
      amount: TOPUP_AMOUNT / 1e6,
      currentBalance: currentBalance / 1e6,
      duration,
      skipped: false
    }

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Gas topup failed for job ${job.job_id}:`, error)
    throw error
  }
}

// Function to poll for gas topup jobs
async function pollForJobs() {
  try {
    // Get pending gas-topup jobs using raw SQL for better control
    const { data: jobs, error } = await supabaseAdmin
      .from('job_logs')
      .select('*')
      .eq('job_type', 'gas-topup')
      .eq('status', 'pending')
      .lt('retry_count', MAX_RETRIES)
      .order('created_at', { ascending: true })
      .limit(5) // Process max 5 jobs at once

    if (error) {
      console.error(`[${new Date().toISOString()}] Error fetching gas-topup jobs:`, error)
      return
    }

    if (!jobs || jobs.length === 0) {
      return // No jobs to process
    }

    // Process each job
    for (const job of jobs) {
      try {
        console.log(`[${new Date().toISOString()}] Attempting to lock gas-topup job ${job.job_id}`)

        // Try to lock the job using FOR UPDATE SKIP LOCKED simulation
        const { data: lockedJob, error: lockError } = await supabaseAdmin
          .from('job_logs')
          .update({
            status: 'active',
            started_at: new Date().toISOString()
          })
          .eq('id', job.id)
          .eq('status', 'pending') // Only update if still pending
          .select()
          .single()

        if (lockError || !lockedJob) {
          console.log(`[${new Date().toISOString()}] Failed to lock job ${job.job_id}, likely already taken`)
          continue
        }

        console.log(`[${new Date().toISOString()}] Successfully locked gas-topup job ${job.job_id}`)

        // Process the job
        const result = await processGasTopup(lockedJob)

        // Update job as completed
        await supabaseAdmin
          .from('job_logs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            data: { 
              ...job.data, 
              result,
              completed_at: new Date().toISOString()
            }
          })
          .eq('id', job.id)

        console.log(`[${new Date().toISOString()}] Gas-topup job ${job.job_id} completed successfully`)

      } catch (error) {
        console.error(`[${new Date().toISOString()}] Gas-topup job ${job.job_id} failed:`, error)

        // Update job as failed or retrying
        const retryCount = (job.retry_count || 0) + 1
        const status = retryCount >= MAX_RETRIES ? 'failed' : 'pending'

        await supabaseAdmin
          .from('job_logs')
          .update({
            status,
            retry_count: retryCount,
            error_message: error instanceof Error ? error.message : String(error),
            completed_at: status === 'failed' ? new Date().toISOString() : null,
            started_at: null // Reset started_at for retries
          })
          .eq('id', job.id)

        if (status === 'failed') {
          console.log(`[${new Date().toISOString()}] Gas-topup job ${job.job_id} failed permanently after ${retryCount} attempts`)
        } else {
          console.log(`[${new Date().toISOString()}] Gas-topup job ${job.job_id} will be retried (attempt ${retryCount}/${MAX_RETRIES})`)
        }
      }
    }

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in gas-topup job polling:`, error)
  }
}

// Start the worker
async function startWorker() {
  console.log(`[${new Date().toISOString()}] Starting gas-topup worker`)

  // Main polling loop
  const pollLoop = async () => {
    while (true) {
      try {
        await pollForJobs()
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error in gas-topup polling loop:`, error)
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL))
    }
  }

  pollLoop()
}

// Handle process termination
process.on('SIGTERM', () => {
  console.log(`[${new Date().toISOString()}] SIGTERM received, shutting down gas-topup worker...`)
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log(`[${new Date().toISOString()}] SIGINT received, shutting down gas-topup worker...`)
  process.exit(0)
})

// Start the worker
startWorker().catch(error => {
  console.error(`[${new Date().toISOString()}] Failed to start gas-topup worker:`, error)
  process.exit(1)
}) 