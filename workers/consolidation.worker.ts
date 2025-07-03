import 'dotenv/config'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { getTronWeb, deriveTronAccount } from '../src/lib/tronWallet'
import TronWeb from 'tronweb'

// Load environment variables from .env.local
config({ path: '.env.local' })

// Constants
const MIN_CONSOLIDATION_AMOUNT = 100 // $100 USDT
const MIN_TRX_BALANCE = 1 * 1e6 // 1 TRX in sun
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

// Helper function to get USDT contract
async function getUSDTContract(tronWeb: any) {
  const contractAddress = process.env.TRON_TRC20_CONTRACT
  if (!contractAddress) {
    throw new Error('TRC20 contract address not found in environment variables')
  }

  const contract = await (tronWeb as any).contract().at(contractAddress)
  if (!contract) {
    throw new Error('Failed to load USDT contract')
  }

  return contract
}

// Helper function to get USDT balance
async function getUSDTBalance(tronWeb: any, address: string): Promise<number> {
  try {
    const contract = await getUSDTContract(tronWeb)
    
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

// Helper function to transfer USDT
async function transferUSDT(
  tronWeb: any,
  fromAddress: string,
  fromPrivateKey: string,
  toAddress: string,
  amount: number
): Promise<string> {
  try {
    const contract = await getUSDTContract(tronWeb)
    const rawAmount = Math.floor(amount * 1e6) // Convert to raw amount (6 decimals)
    
    console.log(`[${new Date().toISOString()}] Transferring ${amount} USDT from ${fromAddress} to ${toAddress}`)
    
    // Set the sender's credentials
    ;(tronWeb as any).setAddress(fromAddress)
    ;(tronWeb as any).setPrivateKey(fromPrivateKey)
    
    const tx = await contract.transfer(toAddress, rawAmount).send({
      feeLimit: 100000000,
      callValue: 0,
      shouldPollResponse: true
    })
    
    console.log(`[${new Date().toISOString()}] USDT transfer successful: ${tx}`)
    return tx
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] USDT transfer failed:`, error)
    throw new Error(`Failed to transfer USDT: ${error.message}`)
  }
}

// Helper function to extract index from derivation path
function getIndexFromPath(path: string): number {
  const match = path.match(/\/0\/(\d+)$/)
  if (!match) {
    throw new Error(`Invalid derivation path format: ${path}`)
  }
  const index = parseInt(match[1])
  if (isNaN(index)) {
    throw new Error(`Invalid index in derivation path: ${path}`)
  }
  return index
}

// Function to create gas topup job
async function createGasTopupJob(userId: string, walletAddress: string) {
  const jobId = `gas-topup-${walletAddress}-${Date.now()}`
  
  const { error } = await supabaseAdmin
    .from('job_logs')
    .insert({
      job_id: jobId,
      job_type: 'gas-topup',
      status: 'pending',
      wallet_address: walletAddress,
      user_id: userId,
      triggered_by: 'system',
      data: { reason: 'consolidation_blocked', wallet_needs_gas: true }
    })

  if (error) {
    console.error(`[${new Date().toISOString()}] Failed to create gas topup job:`, error)
    throw new Error(`Failed to create gas topup job: ${error.message}`)
  }

  console.log(`[${new Date().toISOString()}] Created gas topup job ${jobId} for wallet ${walletAddress}`)
}

// Main consolidation function
async function processConsolidation(job: any) {
  const startTime = Date.now()
  console.log(`[${new Date().toISOString()}] Processing consolidation job ${job.job_id}`)

  try {
    const { wallet_address: walletAddress, user_id: userId } = job
    
    if (!walletAddress) {
      throw new Error('Wallet address not provided in job data')
    }

    // Get wallet info from database
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('user_wallets')
      .select('user_id, address, derivation_path, needs_gas, on_chain_balance')
      .eq('address', walletAddress)
      .single()

    if (walletError || !wallet) {
      throw new Error(`Failed to get wallet info: ${walletError?.message || 'Wallet not found'}`)
    }

    // Check if wallet needs gas
    if (wallet.needs_gas) {
      console.log(`[${new Date().toISOString()}] Wallet ${walletAddress} needs gas, creating gas topup job and skipping consolidation`)
      
      // Create gas topup job
      await createGasTopupJob(wallet.user_id, walletAddress)
      
      // Mark this consolidation job as failed due to gas requirement
      throw new Error('Wallet needs gas before consolidation can proceed')
    }

    // Get TronWeb instance
    const tronWeb = await getTronWeb()
    
    // Get admin account for receiving funds
    const adminAccount = await deriveTronAccount(0)
    const adminAddress = formatAddress(tronWeb, adminAccount.address)

    // Get user's account using their derivation path
    const index = getIndexFromPath(wallet.derivation_path)
    const userAccount = await deriveTronAccount(index)
    const userAddress = formatAddress(tronWeb, userAccount.address)

    // Verify the derived address matches the stored address
    if (userAddress !== walletAddress) {
      throw new Error(`Derived address ${userAddress} does not match stored address ${walletAddress}`)
    }

    // Check TRX balance to ensure enough for transaction fees
    const trxBalance = await getTRXBalance(tronWeb, userAddress)
    console.log(`[${new Date().toISOString()}] Wallet ${userAddress} has ${trxBalance / 1e6} TRX`)

    if (trxBalance < MIN_TRX_BALANCE) {
      console.log(`[${new Date().toISOString()}] Insufficient TRX balance, creating gas topup job`)
      
      // Update wallet flag
      await supabaseAdmin
        .from('user_wallets')
        .update({ needs_gas: true })
        .eq('address', walletAddress)

      // Create gas topup job
      await createGasTopupJob(wallet.user_id, walletAddress)
      
      throw new Error(`Insufficient TRX balance for transaction fees: ${trxBalance / 1e6} TRX`)
    }

    // Get current USDT balance - set proper TronWeb context
    ;(tronWeb as any).setAddress(userAddress)
    ;(tronWeb as any).setPrivateKey(userAccount.privateKey)
    
    const usdtBalance = await getUSDTBalance(tronWeb, userAddress)
    console.log(`[${new Date().toISOString()}] Wallet ${userAddress} has ${usdtBalance} USDT`)

    if (usdtBalance < MIN_CONSOLIDATION_AMOUNT) {
      console.log(`[${new Date().toISOString()}] USDT balance too low for consolidation: ${usdtBalance} < ${MIN_CONSOLIDATION_AMOUNT}`)
      
      // Update wallet flags
      await supabaseAdmin
        .from('user_wallets')
        .update({ 
          needs_consolidation: false,
          on_chain_balance: usdtBalance 
        })
        .eq('address', walletAddress)

      return {
        txid: null,
        message: 'USDT balance too low for consolidation',
        balance: usdtBalance,
        skipped: true
      }
    }

    // Check if another active consolidation job exists for this wallet
    const { data: activeJobs, error: activeJobsError } = await supabaseAdmin
      .from('job_logs')
      .select('id')
      .eq('wallet_address', walletAddress)
      .eq('job_type', 'consolidation')
      .eq('status', 'active')
      .neq('id', job.id)

    if (activeJobsError) {
      throw new Error(`Failed to check active jobs: ${activeJobsError.message}`)
    }

    if (activeJobs && activeJobs.length > 0) {
      throw new Error('Another consolidation job is already active for this wallet')
    }

    // Transfer USDT to admin wallet
    const txid = await transferUSDT(
      tronWeb,
      userAddress,
      userAccount.privateKey,
      adminAddress,
      usdtBalance
    )

    // Update wallet flags and balance
    await supabaseAdmin
      .from('user_wallets')
      .update({ 
        needs_consolidation: false,
        on_chain_balance: 0 
      })
      .eq('address', walletAddress)

    const duration = Date.now() - startTime
    console.log(`[${new Date().toISOString()}] Consolidation completed in ${duration}ms: ${usdtBalance} USDT from ${userAddress}`)

    return {
      txid,
      amount: usdtBalance,
      fromAddress: userAddress,
      toAddress: adminAddress,
      duration,
      skipped: false
    }

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Consolidation failed for job ${job.job_id}:`, error)
    throw error
  }
}

// Function to poll for consolidation jobs
async function pollForJobs() {
  try {
    // Get pending consolidation jobs
    const { data: jobs, error } = await supabaseAdmin
      .from('job_logs')
      .select('*')
      .eq('job_type', 'consolidation')
      .eq('status', 'pending')
      .lt('retry_count', MAX_RETRIES)
      .order('created_at', { ascending: true })
      .limit(3) // Process max 3 consolidation jobs at once

    if (error) {
      console.error(`[${new Date().toISOString()}] Error fetching consolidation jobs:`, error)
      return
    }

    if (!jobs || jobs.length === 0) {
      return // No jobs to process
    }

    // Process each job
    for (const job of jobs) {
      try {
        console.log(`[${new Date().toISOString()}] Attempting to lock consolidation job ${job.job_id}`)

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

        console.log(`[${new Date().toISOString()}] Successfully locked consolidation job ${job.job_id}`)

        // Process the job
        const result = await processConsolidation(lockedJob)

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

        console.log(`[${new Date().toISOString()}] Consolidation job ${job.job_id} completed successfully`)

      } catch (error) {
        console.error(`[${new Date().toISOString()}] Consolidation job ${job.job_id} failed:`, error)

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
          console.log(`[${new Date().toISOString()}] Consolidation job ${job.job_id} failed permanently after ${retryCount} attempts`)
        } else {
          console.log(`[${new Date().toISOString()}] Consolidation job ${job.job_id} will be retried (attempt ${retryCount}/${MAX_RETRIES})`)
        }
      }
    }

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in consolidation job polling:`, error)
  }
}

// Start the worker
async function startWorker() {
  console.log(`[${new Date().toISOString()}] Starting consolidation worker`)

  // Main polling loop
  const pollLoop = async () => {
    while (true) {
      try {
        await pollForJobs()
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error in consolidation polling loop:`, error)
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL))
    }
  }

  pollLoop()
}

// Handle process termination
process.on('SIGTERM', () => {
  console.log(`[${new Date().toISOString()}] SIGTERM received, shutting down consolidation worker...`)
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log(`[${new Date().toISOString()}] SIGINT received, shutting down consolidation worker...`)
  process.exit(0)
})

// Start the worker
startWorker().catch(error => {
  console.error(`[${new Date().toISOString()}] Failed to start consolidation worker:`, error)
  process.exit(1)
}) 