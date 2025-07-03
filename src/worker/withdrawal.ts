// worker/withdrawal.ts
import 'dotenv/config'
import { Worker, Job } from 'bullmq'
import { redisConnection } from '@/lib/redis';
import { createClient as createAdmin } from '@supabase/supabase-js'
import { getTronWeb, deriveTronAccount } from '@/lib/tronWallet'

// Initialize TronWeb with proper error handling
let tronWeb: any
try {
  if (!process.env.HDWALLET_MNEMONIC) {
    throw new Error('HDWALLET_MNEMONIC is not set in environment variables')
  }

  // Get TronWeb instance using the existing functionality
  tronWeb = await getTronWeb()

  // Derive the admin account (index 0)
  const adminAccount = await deriveTronAccount(0)
  
  // Set the default address and private key
  tronWeb.setAddress(adminAccount.address)
  tronWeb.setPrivateKey(adminAccount.privateKey)

  // Verify the account is properly set up
  const accountInfo = await tronWeb.trx.getAccount(adminAccount.address)
  console.log('TronWeb initialized with account:', {
    address: adminAccount.address,
    balance: accountInfo.balance,
    frozen: accountInfo.frozen
  })

} catch (err) {
  console.error('Failed to initialize TronWeb:', err)
  process.exit(1)
}

// Supabase admin client
const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function processWithdrawal(job: Job) {
  const { withdrawalId, to_address, amount, fee } = job.data

  try {
    // Validate inputs
    if (!to_address || !amount || amount <= 0) {
      throw new Error('Invalid withdrawal parameters')
    }

    // 1) load the on-chain contract with proper error handling
    let contract
    try {
      console.log('Loading contract at:', process.env.TRON_TRC20_CONTRACT)
      contract = await tronWeb.contract().at(process.env.TRON_TRC20_CONTRACT!)
      if (!contract) {
        throw new Error('Failed to load contract')
      }
      console.log('Contract loaded successfully')

      // Verify contract details
      const name = await contract.name().call()
      const symbol = await contract.symbol().call()
      const decimals = await contract.decimals().call()
      console.log('Contract details:', { name, symbol, decimals })
    } catch (err: any) {
      console.error('Contract loading error:', err)
      throw new Error(`Failed to load contract: ${err.message || JSON.stringify(err)}`)
    }

    // 2) invoke transfer with proper error handling
    const rawAmount = Math.floor(amount * 1e6)
    console.log(`Processing withdrawal #${withdrawalId}:`, {
      to_address,
      amount,
      rawAmount,
      contractAddress: process.env.TRON_TRC20_CONTRACT
    })

    let receipt
    try {
      // Check sender's balance
      const senderAddress = tronWeb.defaultAddress.base58
      const balance = await contract.balanceOf(senderAddress).call()
      console.log('Sender balance:', balance.toString())

      if (balance.lt(rawAmount)) {
        throw new Error(`Insufficient balance. Required: ${rawAmount}, Available: ${balance.toString()}`)
      }

      // Prepare and send the transaction
      const tx = contract.methods.transfer(to_address, rawAmount)
      console.log('Transaction prepared:', {
        method: 'transfer',
        from: senderAddress,
        to: to_address,
        amount: rawAmount
      })

      receipt = await tx.send()
      console.log('Transaction receipt:', receipt)

      if (!receipt) {
        throw new Error('Transfer failed - no receipt received')
      }
    } catch (err: any) {
      console.error('Transfer error details:', {
        error: err,
        message: err.message,
        stack: err.stack,
        code: err.code
      })
      throw new Error(`Transfer failed: ${err.message || JSON.stringify(err)}`)
    }

    const txId = receipt
    console.log(`Transfer successful for withdrawal #${withdrawalId}, txId:`, txId)

    // 3) update withdrawals table
    try {
      await supabaseAdmin
        .from('withdrawals')
        .update({
          status: 'completed',
          tx_id: txId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', withdrawalId)

      console.log(`✅ Withdrawal #${withdrawalId} completed (tx: ${txId})`)
    } catch (err: any) {
      console.error('Database update error:', err.message)
      throw new Error(`Failed to update withdrawal status: ${err.message}`)
    }

  } catch (err: any) {
    console.error(`❌ Withdrawal #${withdrawalId} failed:`, err.message)

    // mark as failed
    try {
      await supabaseAdmin
        .from('withdrawals')
        .update({
          status: 'failed',
          error_message: err.message || 'Unknown error occurred',
          updated_at: new Date().toISOString(),
        })
        .eq('id', withdrawalId)
    } catch (dbErr: any) {
      console.error('Failed to update withdrawal status:', dbErr.message)
    }

    throw err // re-throw so BullMQ can apply backoff/retries
  }
}

// Initialize worker with Redis configuration
const worker = new Worker('withdrawal', async job => {
  if (job.name === 'withdraw') {
    await processWithdrawal(job)
  }
}, {
  connection: {
    ...redisConnection.options,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000)
      console.log(`Retrying Redis connection in ${delay}ms... (attempt ${times})`)
      return delay
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    }
  },
  concurrency: 2,
  stalledInterval: 30000,
  drainDelay: 5,
})

// Worker event handlers
worker.on('completed', job => console.log(`Job ${job.id} done`))
worker.on('failed', (job, e) => console.error(`Job ${job?.id} error: ${e.message}`))
worker.on('error', err => {
  console.error('Worker error:', err)
  if (err.message.includes('ECONNRESET')) {
    console.log('Connection reset detected, attempting to reconnect...')
  }
})
worker.on('stalled', jobId => console.warn(`Job ${jobId} stalled`))

// Handle process termination
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...')
  await worker.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing worker...')
  await worker.close()
  process.exit(0)
})
