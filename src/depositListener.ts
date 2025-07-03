import dotenv from 'dotenv'
import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'
import pLimit from 'p-limit'

dotenv.config({ path: '.env.local' })

// ─── Configuration ───────────────────────────────────────────────────
interface Config {
  tronFullHost: string
  tronApiKey?: string
  supabaseUrl: string
  supabaseServiceKey: string
  tronTrc20Contract: string
  pollInterval: number
  batchSize: number
  maxRetries: number
  retryDelay: number
  requestTimeout: number
  concurrencyLimit: number
  minConfirmations: number
}

const config: Config = {
  tronFullHost: process.env.TRON_FULL_HOST!,
  tronApiKey: process.env.TRON_API_KEY,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  tronTrc20Contract: process.env.TRON_TRC20_CONTRACT!,
  pollInterval: parseInt(process.env.POLL_INTERVAL || '15000'),
  batchSize: parseInt(process.env.BATCH_SIZE || '50'),
  maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
  retryDelay: parseInt(process.env.RETRY_DELAY || '2000'),
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '10000'),
  concurrencyLimit: parseInt(process.env.CONCURRENCY_LIMIT || '5'),
  minConfirmations: parseInt(process.env.MIN_CONFIRMATIONS || '1')
}

// ─── Validation ───────────────────────────────────────────────────────
function validateConfig() {
  const required = ['tronFullHost', 'supabaseUrl', 'supabaseServiceKey', 'tronTrc20Contract']
  const missing = required.filter(key => !config[key as keyof Config])
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`)
    process.exit(1)
  }
  
  console.log('✅ Configuration validated')
  console.log(`📊 Poll interval: ${config.pollInterval/1000}s`)
  console.log(`📦 Batch size: ${config.batchSize}`)
  console.log(`🔄 Max retries: ${config.maxRetries}`)
  console.log(`⚡ Concurrency limit: ${config.concurrencyLimit}`)
  console.log(`🎯 Contract: ${config.tronTrc20Contract}`)
}

// ─── Database Client ──────────────────────────────────────────────────
const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ─── Types ─────────────────────────────────────────────────────────────
interface UserWallet {
  address: string
  user_id: string
  balance: number
}

interface TronTransaction {
  transaction_id?: string
  transactionId?: string
  txID?: string
  to_address?: string
  toAddress?: string
  transferToAddress?: string
  to?: string
  value?: string
  amount?: string
  tokenInfo?: {
    address?: string
  }
  token_info?: {
    address?: string
    symbol?: string
    decimals?: number
    name?: string
  }
  token_address?: string
  tokenAddress?: string
  contract_address?: string
  contractAddress?: string
  block_timestamp?: number
  confirmed?: boolean
}

interface ProcessedTransaction {
  tx_id: string
  user_id: string
  amount: number
  address: string
}

// ─── Metrics & Monitoring ─────────────────────────────────────────────
class Metrics {
  private stats = {
    walletsProcessed: 0,
    transactionsFound: 0,
    transactionsProcessed: 0,
    errors: 0,
    apiCalls: 0,
    successfulApiCalls: 0,
    startTime: Date.now(),
    lastPollTime: 0,
    totalAmount: 0
  }

  increment(key: keyof typeof this.stats, value = 1) {
    if (typeof this.stats[key] === 'number') {
      (this.stats[key] as number) += value
    }
  }

  set(key: keyof typeof this.stats, value: number) {
    (this.stats[key] as number) = value
  }

  getStats() {
    return {
      ...this.stats,
      uptime: Date.now() - this.stats.startTime,
      lastPollAgo: Date.now() - this.stats.lastPollTime
    }
  }

  logStats() {
    const stats = this.getStats()
    console.log('\n📊 === METRICS ===')
    console.log(`🕐 Uptime: ${Math.floor(stats.uptime / 1000)}s`)
    console.log(`📦 Wallets processed: ${stats.walletsProcessed}`)
    console.log(`💰 Transactions found: ${stats.transactionsFound}`)
    console.log(`✅ Transactions processed: ${stats.transactionsProcessed}`)
    console.log(`💵 Total amount processed: $${stats.totalAmount.toFixed(2)}`)
    console.log(`🌐 API calls: ${stats.successfulApiCalls}/${stats.apiCalls}`)
    console.log(`❌ Errors: ${stats.errors}`)
    console.log(`⏰ Last poll: ${Math.floor(stats.lastPollAgo / 1000)}s ago`)
  }
}

const metrics = new Metrics()

// ─── Utilities ────────────────────────────────────────────────────────
function extractAddress(tx: TronTransaction): string | null {
  return tx.to_address ?? tx.toAddress ?? tx.transferToAddress ?? tx.to ?? null
}

function extractTxId(tx: TronTransaction): string | null {
  return tx.transaction_id ?? tx.transactionId ?? tx.txID ?? null
}

function extractValue(tx: TronTransaction): string | null {
  return tx.value ?? tx.amount ?? null
}

function extractContractAddress(tx: TronTransaction): string | null {
  return tx.tokenInfo?.address ?? 
         tx.token_info?.address ??
         tx.token_address ?? 
         tx.tokenAddress ?? 
         tx.contract_address ?? 
         tx.contractAddress ?? null
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Helper function to get error message safely
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Unknown error occurred'
}

// ─── API Client with Retry Logic ──────────────────────────────────────
class TronApiClient {
  private readonly baseUrl: string
  private readonly headers: Record<string, string>

  constructor() {
    this.baseUrl = config.tronFullHost.replace(/\/+$/, '')
    this.headers = {}
    if (config.tronApiKey) {
      this.headers['TRON-PRO-API-KEY'] = config.tronApiKey
    }
  }

  async fetchTransactions(address: string, retryCount = 0): Promise<TronTransaction[]> {
    const url = `${this.baseUrl}/v1/accounts/${address}/transactions/trc20?only_confirmed=true&limit=100`
    
    metrics.increment('apiCalls')
    
    try {
      // Use a timeout promise instead of AbortController for better compatibility
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), config.requestTimeout)
      })
      
      const fetchPromise = fetch(url, {
        headers: this.headers
      })
      
      const response = await Promise.race([fetchPromise, timeoutPromise])
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      metrics.increment('successfulApiCalls')
      
      if (!Array.isArray(data.data)) {
        throw new Error('Invalid response format')
      }
      
      return data.data
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      console.error(`💥 API error for ${address} (attempt ${retryCount + 1}):`, errorMessage)
      
      if (retryCount < config.maxRetries) {
        const delay = config.retryDelay * Math.pow(2, retryCount) // Exponential backoff
        console.log(`⏳ Retrying in ${delay}ms...`)
        await sleep(delay)
        return this.fetchTransactions(address, retryCount + 1)
      }
      
      metrics.increment('errors')
      throw error
    }
  }
}

// ─── Database Operations ──────────────────────────────────────────────
class DatabaseManager {
  async getWalletsBatch(offset: number, limit: number): Promise<UserWallet[]> {
    const { data, error } = await supabase
      .from('user_wallets')
      .select('address, user_id, balance')
      .range(offset, offset + limit - 1)
      .order('address')

    if (error) throw error
    
    return data?.map(row => ({
      address: row.address,
      user_id: row.user_id,
      balance: Number(row.balance) || 0
    })) || []
  }

  async getTotalWalletCount(): Promise<number> {
    const { count, error } = await supabase
      .from('user_wallets')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    return count || 0
  }

  async isTransactionProcessed(txId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('processed_txs')
      .select('tx_id')
      .eq('tx_id', txId)
      .maybeSingle()

    if (error) throw error
    return !!data
  }

  async processTransactionSafely(transaction: ProcessedTransaction): Promise<boolean> {
    try {
      // Start transaction
      const { data: walletData, error: walletError } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('address', transaction.address)
        .single()

      if (walletError) throw walletError

      const currentBalance = Number(walletData.balance) || 0
      const newBalance = currentBalance + transaction.amount

      // Use RPC for atomic transaction
      const { data, error } = await supabase.rpc('process_deposit_transaction', {
        p_tx_id: transaction.tx_id,
        p_user_id: transaction.user_id,
        p_amount: transaction.amount,
        p_address: transaction.address,
        p_new_balance: newBalance
      })

      if (error) {
        console.error(`💥 Transaction processing failed for ${transaction.tx_id}:`, error)
        return false
      }

      console.log(`✅ Processed ${transaction.tx_id}: +$${transaction.amount} (balance: $${newBalance})`)
      metrics.increment('transactionsProcessed')
      metrics.increment('totalAmount', transaction.amount)
      
      return true
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      console.error(`💥 Database error processing ${transaction.tx_id}:`, errorMessage)
      metrics.increment('errors')
      return false
    }
  }
}

// ─── Main Processor ───────────────────────────────────────────────────
class DepositProcessor {
  private readonly apiClient: TronApiClient
  private readonly dbManager: DatabaseManager
  private readonly concurrencyLimit: ReturnType<typeof pLimit>
  private isProcessing = false

  constructor() {
    this.apiClient = new TronApiClient()
    this.dbManager = new DatabaseManager()
    this.concurrencyLimit = pLimit(config.concurrencyLimit)
  }

  async processWallet(wallet: UserWallet): Promise<void> {
    return this.concurrencyLimit(async () => {
      try {
        console.log(`🔍 Processing wallet: ${wallet.address}`)
        
        const transactions = await this.apiClient.fetchTransactions(wallet.address)
        console.log(`📦 Found ${transactions.length} transactions for ${wallet.address}`)
        
        // DEBUG: Log first transaction structure if any exist
        if (transactions.length > 0) {
          console.log(`🔧 DEBUG: First transaction structure:`, JSON.stringify(transactions[0], null, 2))
        }
        
        const relevantTransactions = transactions.filter((tx, index) => {
          const contractAddress = extractContractAddress(tx)
          const toAddress = extractAddress(tx)
          
          // DEBUG: Log filtering details for first few transactions
          if (index < 3) {
            console.log(`🔧 DEBUG Transaction ${index}:`)
            console.log(`   Contract Address: ${contractAddress}`)
            console.log(`   Expected Contract: ${config.tronTrc20Contract}`)
            console.log(`   To Address: ${toAddress}`)
            console.log(`   Expected Address: ${wallet.address}`)
            console.log(`   Confirmed: ${tx.confirmed}`)
            console.log(`   Contract Match: ${contractAddress?.toLowerCase() === config.tronTrc20Contract.toLowerCase()}`)
            console.log(`   Address Match: ${toAddress === wallet.address}`)
            console.log(`   Confirmation OK: ${tx.confirmed !== false}`)
          }
          
          return contractAddress?.toLowerCase() === config.tronTrc20Contract.toLowerCase() &&
                 toAddress === wallet.address &&
                 tx.confirmed !== false
        })

        console.log(`💰 Found ${relevantTransactions.length} relevant transactions`)
        metrics.increment('transactionsFound', relevantTransactions.length)

        for (const tx of relevantTransactions) {
          await this.processTransaction(tx, wallet)
        }

        metrics.increment('walletsProcessed')
      } catch (error) {
        const errorMessage = getErrorMessage(error)
        console.error(`💥 Error processing wallet ${wallet.address}:`, errorMessage)
        metrics.increment('errors')
      }
    })
  }

  async processTransaction(tx: TronTransaction, wallet: UserWallet): Promise<void> {
    const txId = extractTxId(tx)
    const rawValue = extractValue(tx)

    if (!txId || !rawValue) {
      console.warn(`⚠️ Skipping malformed transaction:`, { txId, rawValue })
      return
    }

    // Check if already processed
    if (await this.dbManager.isTransactionProcessed(txId)) {
      console.log(`ℹ️ Transaction ${txId} already processed`)
      return
    }

    const amount = Number(rawValue) / 1e6 // Convert from smallest unit
    if (amount <= 0) {
      console.warn(`⚠️ Skipping zero/negative amount transaction: ${txId}`)
      return
    }

    console.log(`💵 Processing transaction ${txId}: +$${amount}`)

    const transaction: ProcessedTransaction = {
      tx_id: txId,
      user_id: wallet.user_id,
      amount,
      address: wallet.address
    }

    await this.dbManager.processTransactionSafely(transaction)
  }

  async pollDeposits(): Promise<void> {
    if (this.isProcessing) {
      console.log('⏳ Previous poll still running, skipping...')
      return
    }

    this.isProcessing = true
    metrics.set('lastPollTime', Date.now())

    try {
      console.log(`\n🔍 Starting deposit poll @ ${new Date().toISOString()}`)
      
      const totalWallets = await this.dbManager.getTotalWalletCount()
      console.log(`📊 Total wallets to process: ${totalWallets}`)

      if (totalWallets === 0) {
        console.log('⚠️ No wallets found')
        return
      }

      // Process wallets in batches
      const promises: Promise<void>[] = []
      
      for (let offset = 0; offset < totalWallets; offset += config.batchSize) {
        const wallets = await this.dbManager.getWalletsBatch(offset, config.batchSize)
        
        for (const wallet of wallets) {
          promises.push(this.processWallet(wallet))
        }
      }

      await Promise.all(promises)
      console.log('✅ Deposit poll completed')
      
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      console.error('💥 Deposit poll failed:', errorMessage)
      metrics.increment('errors')
    } finally {
      this.isProcessing = false
    }
  }

  start(): void {
    console.log(`🚀 Starting deposit processor...`)
    
    // Initial poll
    this.pollDeposits()
    
    // Regular polling
    setInterval(() => {
      this.pollDeposits()
    }, config.pollInterval)
    
    // Metrics logging
    setInterval(() => {
      metrics.logStats()
    }, 60000) // Every minute
  }
}

// ─── Health Check Server ──────────────────────────────────────────────
import { createServer } from 'http'

function startHealthCheckServer() {
  const server = createServer((req, res) => {
    if (req.url === '/health') {
      const stats = metrics.getStats()
      const isHealthy = stats.lastPollAgo < config.pollInterval * 2 // Consider unhealthy if no poll in 2x interval
      
      res.writeHead(isHealthy ? 200 : 503, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        status: isHealthy ? 'healthy' : 'unhealthy',
        ...stats
      }))
    } else {
      res.writeHead(404)
      res.end('Not Found')
    }
  })

  const port = parseInt(process.env.HEALTH_CHECK_PORT || '3001')
  server.listen(port, () => {
    console.log(`🏥 Health check server running on port ${port}`)
  })
}

// ─── Database Setup ───────────────────────────────────────────────────
async function setupDatabase() {
  console.log('🔧 Setting up database functions...')
  
  // Create the atomic transaction function
  const { error } = await supabase.rpc('create_process_deposit_function')
  
  if (error && !error.message.includes('already exists')) {
    console.error('❌ Failed to create database function:', error)
    // Don't exit, function might already exist
  } else {
    console.log('✅ Database function ready')
  }
}

// ─── Main Entry Point ─────────────────────────────────────────────────
async function main() {
  console.log('🎯 CoinSensei Deposit Listener v2.0')
  console.log('=====================================')
  
  validateConfig()
  
  try {
    await setupDatabase()
    startHealthCheckServer()
    
    const processor = new DepositProcessor()
    processor.start()
    
  } catch (error) {
    const errorMessage = getErrorMessage(error)
    console.error('💥 Startup failed:', errorMessage)
    process.exit(1)
  }
}

// ─── Process Handlers ─────────────────────────────────────────────────
process.on('SIGINT', () => {
  console.log('\n👋 Gracefully shutting down...')
  metrics.logStats()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...')
  metrics.logStats()
  process.exit(0)
})

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  metrics.increment('errors')
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  metrics.increment('errors')
})

// Start the application
main().catch(error => {
  const errorMessage = getErrorMessage(error)
  console.error('❌ Fatal error:', errorMessage)
  process.exit(1)
}) 