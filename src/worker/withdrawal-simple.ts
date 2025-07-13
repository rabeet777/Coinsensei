// ✅ CRITICAL: Load environment variables FIRST before any other imports
import { config } from 'dotenv'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fetch from 'node-fetch'

// Configure global fetch for Supabase
// @ts-expect-error global fetch is required for Supabase but not typed in Node
global.fetch = fetch

// Load environment variables from .env.local IMMEDIATELY
config({ path: '.env.local' })

// Get current file's directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Import dependencies
import { getTronWeb, deriveTronAccount } from '../lib/tronWallet.js'
import { getPendingWithdrawalJobs, markJobAsProcessing, markJobAsCompleted, markJobAsFailed } from '../lib/simpleQueue.js'

// Constants
const POLL_INTERVAL = 10000 // 10 seconds
const MAX_CONCURRENT_JOBS = 3

// ✅ IMPROVED: Environment variable validation
function validateEnvironmentVariables() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'TRON_FULL_HOST',
    'TRON_API_KEY',
    'TRON_TRC20_CONTRACT',
    'ENCRYPTED_HDWALLET_MNEMONIC',
    'WALLET_ENCRYPTION_KEY',
    'WALLET_IV',
    'WALLET_AUTH_TAG'
  ]
  
  console.log('🔍 Validating environment variables...')
  
  const missingVars = requiredEnvVars.filter(envVar => {
    const value = process.env[envVar]
    const exists = !!value
    console.log(`   ${exists ? '✅' : '❌'} ${envVar}: ${exists ? 'SET' : 'MISSING'}`)
    return !exists
  })
  
  if (missingVars.length > 0) {
    console.error('\n🚨 WITHDRAWAL WORKER STARTUP FAILED')
    console.error('❌ Missing required environment variables:')
    missingVars.forEach(v => console.error(`   - ${v}`))
    console.error('\n💡 Please check your .env.local file')
    console.error('💡 Or run: node setup-withdrawal-worker.js to diagnose the issue')
    return false
  }
  
  console.log('✅ All required environment variables are present\n')
  return true
}

// ✅ IMPROVED: Validate environment variables before creating clients
if (!validateEnvironmentVariables()) {
  process.exit(1)
}

// Supabase admin client (only created after validation)
const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Initialize TronWeb
let tronWeb: any
let adminAccount: any

async function initializeTronWeb() {
  try {
    console.log('🔗 Initializing TronWeb for withdrawal worker...')
    
    // Get TronWeb instance using encrypted mnemonic
    tronWeb = await getTronWeb()
    
    // Derive the admin account (index 0) 
    adminAccount = await deriveTronAccount(0)
    
    // Set the default address and private key
    tronWeb.setAddress(adminAccount.address)
    tronWeb.setPrivateKey(adminAccount.privateKey)
    
    // Verify the account is properly set up
    const accountInfo = await tronWeb.trx.getAccount(adminAccount.address)
    console.log('✅ TronWeb initialized successfully:', {
      address: adminAccount.address,
      balance: accountInfo.balance || 0,
      derivationPath: adminAccount.derivationPath
    })
    
    return true
  } catch (err) {
    console.error('❌ Failed to initialize TronWeb:', err)
    return false
  }
}

// ✅ IMPROVED: Database connectivity check
async function testDatabaseConnection() {
  try {
    console.log('🔌 Testing database connection...')
    
    // Test basic connectivity
    const { data, error } = await supabaseAdmin
      .from('withdrawal_jobs')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      console.error('💡 Please check your SUPABASE credentials and network connection')
      return false
    }
    
    console.log('✅ Database connection successful')
    
    // Check if withdrawal_jobs table exists
    const { data: jobCounts, error: countError } = await supabaseAdmin
      .from('withdrawal_jobs')
      .select('status')
    
    if (countError) {
      console.error('❌ withdrawal_jobs table not found:', countError.message)
      console.error('💡 Please run: psql $DATABASE_URL -f sql/create_withdrawal_jobs_table.sql')
      return false
    }
    
    // Count jobs by status
    const statusCounts: Record<string, number> = {}
    jobCounts.forEach((job: any) => {
      statusCounts[job.status] = (statusCounts[job.status] || 0) + 1
    })
    
    console.log('📊 Job queue status:')
    console.log('   Total jobs:', jobCounts.length)
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`)
    })
    
    if (statusCounts.pending > 0) {
      console.log(`🔥 Found ${statusCounts.pending} pending withdrawal jobs ready for processing!`)
    } else {
      console.log('📭 No pending jobs found. Worker will poll for new jobs...')
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Database connectivity test failed:', error)
    return false
  }
}

async function processWithdrawalJob(job: any) {
  const { withdrawal_id, to_address, amount, fee, user_id } = job
  
  try {
    console.log(`🚀 Processing withdrawal job ${job.id} for ${amount} USDT to ${to_address}`)
    
    // Validate inputs
    if (!to_address || !amount || amount <= 0) {
      throw new Error('Invalid withdrawal parameters')
    }

    // Load the TRC20 contract
    console.log('📋 Loading TRC20 contract...')
    const contract = await tronWeb.contract().at(process.env.TRON_TRC20_CONTRACT!)
    
    if (!contract) {
      throw new Error('Failed to load TRC20 contract')
    }

    // Verify contract details
    const [name, symbol, decimals] = await Promise.all([
      contract.name().call(),
      contract.symbol().call(), 
      contract.decimals().call()
    ])
    
    console.log('📋 Contract details:', { name, symbol, decimals: decimals.toString() })

    // Calculate raw amount (USDT has 6 decimals)
    const rawAmount = Math.floor(amount * 1e6)
    
    // Check sender's balance
    const senderAddress = tronWeb.defaultAddress.base58
    const balance = await contract.balanceOf(senderAddress).call()
    
    console.log('💰 Sender balance check:', {
      senderAddress,
      balance: balance.toString(),
      required: rawAmount,
      balanceUSDT: (Number(balance) / 1e6).toFixed(2)
    })

    if (balance.lt(rawAmount)) {
      throw new Error(`Insufficient balance. Required: ${rawAmount}, Available: ${balance.toString()}`)
    }

    // Prepare and send the transaction
    console.log('📤 Sending transaction...')
    const tx = contract.methods.transfer(to_address, rawAmount)
    const receipt = await tx.send()
    
    if (!receipt) {
      throw new Error('Transfer failed - no receipt received')
    }

    const txId = receipt
    console.log(`✅ Transfer successful! TX ID: ${txId}`)

    // Update withdrawals table
    await supabaseAdmin
      .from('withdrawals')
      .update({
        status: 'completed',
        tx_id: txId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', withdrawal_id)

    // Mark job as completed
    await markJobAsCompleted(job.id, txId)
    
    console.log(`✅ Withdrawal job ${job.id} completed successfully (TX: ${txId})`)
    return { success: true, txId }

  } catch (err: any) {
    console.error(`❌ Withdrawal job ${job.id} failed:`, err.message)

    // Update withdrawal status in database
    try {
      await supabaseAdmin
        .from('withdrawals')
        .update({
          status: 'failed',
          error_message: err.message || 'Unknown error occurred',
          updated_at: new Date().toISOString(),
        })
        .eq('id', withdrawal_id)
    } catch (dbErr: any) {
      console.error('❌ Failed to update withdrawal status:', dbErr.message)
    }

    // Mark job as failed
    await markJobAsFailed(job.id, err.message || 'Unknown error occurred')
    
    throw err
  }
}

async function pollForJobs() {
  try {
    // Get pending withdrawal jobs
    const jobs = await getPendingWithdrawalJobs(MAX_CONCURRENT_JOBS)
    
    if (jobs.length === 0) {
      // Only log this occasionally to reduce noise
      if (Date.now() % (POLL_INTERVAL * 6) < POLL_INTERVAL) {
        console.log('📭 No pending jobs found, continuing to poll...')
      }
      return // No jobs to process
    }

    console.log(`🔥 Found ${jobs.length} pending withdrawal jobs`)

    // Process each job
    for (const job of jobs) {
      try {
        // Mark job as processing
        await markJobAsProcessing(job.id)
        
        // Process the withdrawal
        await processWithdrawalJob(job)
        
      } catch (error) {
        console.error(`❌ Error processing job ${job.id}:`, error)
        // Job failure is already handled in processWithdrawalJob
      }
    }

  } catch (error) {
    console.error('❌ Error in withdrawal job polling:', error)
  }
}

// Start the worker
async function startWorker() {
  console.log('🚀 Starting withdrawal worker (Simple Queue)')
  console.log('🔧 Configuration:')
  console.log(`   - Poll interval: ${POLL_INTERVAL}ms`)
  console.log(`   - Max concurrent jobs: ${MAX_CONCURRENT_JOBS}`)
  console.log(`   - TRC20 Contract: ${process.env.TRON_TRC20_CONTRACT}`)
  console.log(`   - TRON Network: ${process.env.TRON_FULL_HOST}`)
  console.log(`   - Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
  
  // Test database connection
  const dbConnected = await testDatabaseConnection()
  if (!dbConnected) {
    console.error('❌ Database connection failed. Exiting...')
    process.exit(1)
  }
  
  // Initialize TronWeb
  const initialized = await initializeTronWeb()
  if (!initialized) {
    console.error('❌ Failed to initialize TronWeb. Exiting...')
    process.exit(1)
  }

  console.log('🎯 Withdrawal worker is ready!')
  console.log('🔄 Starting polling loop...')

  // Main polling loop
  const pollLoop = async () => {
    while (true) {
      try {
        await pollForJobs()
      } catch (error) {
        console.error('❌ Error in polling loop:', error)
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL))
    }
  }

  pollLoop()
}

// Handle process termination
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down withdrawal worker...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down withdrawal worker...')
  process.exit(0)
})

// ✅ IMPROVED: Better error handling on startup
startWorker().catch(error => {
  console.error('💥 Failed to start withdrawal worker:', error)
  console.error('💡 Please check your environment variables and database connection')
  console.error('💡 Run: node setup-withdrawal-worker.js to diagnose the issue')
  process.exit(1)
}) 