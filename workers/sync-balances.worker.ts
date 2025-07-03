import 'dotenv/config'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { getTronWeb, deriveTronAccount } from '../src/lib/tronWallet'
import TronWeb from 'tronweb'

// Load environment variables from .env.local
config({ path: '.env.local' })

// Type declaration for TronWeb
type TronWebInstance = typeof TronWeb

// Constants
const CONSOLIDATION_THRESHOLD = 200 // $200 USDT
const MIN_TRX_BALANCE = 5 * 1e6 // 5 TRX in sun
const POLL_INTERVAL = 5000 // 5 seconds
const MAX_RETRIES = 3

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

// Helper function to get USDT balance
async function getUSDTBalance(tronWeb: any, address: string): Promise<number> {
  try {
    const contractAddress = process.env.TRON_TRC20_CONTRACT
    if (!contractAddress) {
      throw new Error('TRC20 contract address not found')
    }

    const contract = await (tronWeb as any).contract().at(contractAddress)
    
    // Ensure address is properly formatted
    const formattedAddress = formatAddress(tronWeb, address)
    
    const balance = await contract.balanceOf(formattedAddress).call()
    return Number(balance) / 1e6 // Convert from raw amount (6 decimals)
  } catch (error) {
    console.error(`Failed to get USDT balance for ${address}:`, error)
    return 0
  }
}

// Helper function to get TRX balance
async function getTRXBalance(tronWeb: any, address: string): Promise<number> {
  try {
    const balance = await (tronWeb as any).trx.getBalance(address)
    return balance
  } catch (error) {
    console.error(`Failed to get TRX balance for ${address}:`, error)
    return 0
  }
}

// Main sync function
async function syncBalances(jobId: string, jobData: any) {
  const startTime = Date.now()
  console.log(`[${new Date().toISOString()}] Starting balance sync for job ${jobId}`)

  try {
    // Get TronWeb instance
    const tronWeb = await getTronWeb()
    
    // Initialize with admin account
    const adminAccount = await deriveTronAccount(0)
    ;(tronWeb as any).setAddress(adminAccount.address)
    ;(tronWeb as any).setPrivateKey(adminAccount.privateKey)

    // Get all user wallets
    const { data: wallets, error: walletsError } = await supabaseAdmin
      .from('user_wallets')
      .select('user_id, address')
      .not('address', 'is', null)

    if (walletsError) {
      throw new Error(`Failed to fetch wallets: ${walletsError.message}`)
    }

    if (!wallets?.length) {
      console.log(`[${new Date().toISOString()}] No wallets found to sync`)
      return { processed: 0, errors: 0 }
    }

    console.log(`[${new Date().toISOString()}] Processing ${wallets.length} wallets`)

    let processed = 0
    let errors = 0

    // Process each wallet
    for (const wallet of wallets) {
      try {
        const formattedAddress = formatAddress(tronWeb, wallet.address)

        // Set TronWeb context for this wallet's address for balance queries
        ;(tronWeb as any).setAddress(formattedAddress)

        // Get both USDT and TRX balances
        const [usdtBalance, trxBalance] = await Promise.all([
          getUSDTBalance(tronWeb, formattedAddress),
          getTRXBalance(tronWeb, formattedAddress)
        ])

        // Determine flags
        const needsConsolidation = usdtBalance > CONSOLIDATION_THRESHOLD
        const needsGas = needsConsolidation &&trxBalance < MIN_TRX_BALANCE

        // Update wallet in database
        const { error: updateError } = await supabaseAdmin
          .from('user_wallets')
          .update({
            on_chain_balance: usdtBalance,
            trx_balance: trxBalance / 1e6, // Store TRX in decimal format
            needs_consolidation: needsConsolidation,
            needs_gas: needsGas,
            last_sync_at: new Date().toISOString()
          })
          .eq('user_id', wallet.user_id)

        if (updateError) {
          console.error(`[${new Date().toISOString()}] Failed to update wallet ${wallet.user_id}:`, updateError)
          errors++
          continue
        }

        console.log(`[${new Date().toISOString()}] Updated ${formattedAddress}: USDT=${usdtBalance}, TRX=${(trxBalance / 1e6).toFixed(2)}, consolidate=${needsConsolidation}, gas=${needsGas}`)
        processed++

        // Restore admin context
        ;(tronWeb as any).setAddress(adminAccount.address)
        ;(tronWeb as any).setPrivateKey(adminAccount.privateKey)

      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error processing wallet ${wallet.address}:`, error)
        errors++
        
        // Ensure admin context is restored even on error
        ;(tronWeb as any).setAddress(adminAccount.address)
        ;(tronWeb as any).setPrivateKey(adminAccount.privateKey)
      }
    }

    const duration = Date.now() - startTime
    console.log(`[${new Date().toISOString()}] Balance sync completed in ${duration}ms. Processed: ${processed}, Errors: ${errors}`)

    return { processed, errors, duration }

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Balance sync failed:`, error)
    throw error
  }
}

// Function to poll for sync jobs
async function pollForJobs() {
  try {
    // Use FOR UPDATE SKIP LOCKED to prevent race conditions
    const { data: jobs, error } = await supabaseAdmin
      .rpc('get_and_lock_job', {
        p_job_type: 'sync',
        p_status: 'pending'
      })

    if (error) {
      console.error(`[${new Date().toISOString()}] Error fetching jobs:`, error)
      return
    }

    if (!jobs || jobs.length === 0) {
      return // No jobs to process
    }

    for (const job of jobs) {
      try {
        console.log(`[${new Date().toISOString()}] Processing sync job ${job.job_id}`)

        // Update job status to active
        await supabaseAdmin
          .from('job_logs')
          .update({
            status: 'active',
            started_at: new Date().toISOString()
          })
          .eq('id', job.id)

        // Execute sync
        const result = await syncBalances(job.job_id, job.data)

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

        console.log(`[${new Date().toISOString()}] Sync job ${job.job_id} completed successfully`)

      } catch (error) {
        console.error(`[${new Date().toISOString()}] Sync job ${job.job_id} failed:`, error)

        // Update job as failed
        const retryCount = (job.retry_count || 0) + 1
        const status = retryCount >= job.max_retries ? 'failed' : 'retrying'

        await supabaseAdmin
          .from('job_logs')
          .update({
            status,
            retry_count: retryCount,
            error_message: error instanceof Error ? error.message : String(error),
            completed_at: status === 'failed' ? new Date().toISOString() : null
          })
          .eq('id', job.id)
      }
    }

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in job polling:`, error)
  }
}

// Add the get_and_lock_job RPC function if it doesn't exist
async function createRPCFunction() {
  // Function already exists from migration, no need to create
  console.log(`[${new Date().toISOString()}] Using existing get_and_lock_job RPC function`)
}

// Start the worker
async function startWorker() {
  console.log(`[${new Date().toISOString()}] Starting sync-balances worker`)
  
  await createRPCFunction()

  // Main polling loop
  const pollLoop = async () => {
    while (true) {
      try {
        await pollForJobs()
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error in polling loop:`, error)
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL))
    }
  }

  pollLoop()
}

// Handle process termination
process.on('SIGTERM', () => {
  console.log(`[${new Date().toISOString()}] SIGTERM received, shutting down...`)
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log(`[${new Date().toISOString()}] SIGINT received, shutting down...`)
  process.exit(0)
})

// Start the worker
startWorker().catch(error => {
  console.error(`[${new Date().toISOString()}] Failed to start worker:`, error)
  process.exit(1)
}) 