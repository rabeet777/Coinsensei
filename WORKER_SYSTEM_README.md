# Worker System Documentation

## Overview

This worker system provides automated wallet management for USDT (TRC20) and TRX balances, including:

- **Balance Synchronization**: Monitors on-chain balances and sets wallet flags
- **Dependent Job Queueing**: Automatically queues jobs based on wallet status
- **Gas Top-up**: Automatically sends TRX for transaction fees when needed
- **Consolidation**: Transfers USDT from user wallets to admin wallet
- **Job Management**: Robust job queue with retry logic and cleanup

## Architecture

### Components

1. **Cron Jobs**
   - `cron/cron-balance-sync.ts` - Creates sync jobs every 5 minutes
   - `cron/cron-queue-dependent-jobs.ts` - Queues gas-topup and consolidation jobs every 5 minutes
   - `cron/cleanup-stuck-jobs.ts` - Cleans up stuck jobs every 10 minutes

2. **Workers**
   - `workers/sync-balances.worker.ts` - Processes balance sync jobs
   - `workers/gas-topup.worker.ts` - Processes gas top-up jobs
   - `workers/consolidation.worker.ts` - Processes consolidation jobs

3. **Database**
   - `job_logs` table - Tracks all worker jobs
   - `user_wallets` table - Stores wallet info and flags
   - RPC functions for job locking and statistics

### Complete Workflow

```
1. Balance Sync Cron (every 5 minutes)
   ↓
2. Sync-Balances Worker processes sync jobs:
   - Updates on-chain USDT and TRX balances
   - Sets needs_gas = true (if TRX < 5)
   - Sets needs_consolidation = true (if USDT > $200)
   ↓
3. Dependent Job Queue Cron (every 5 minutes)
   - If needs_gas = true → queue gas-topup job
   - If needs_consolidation = true AND needs_gas = false → queue consolidation job
   ↓
4. Workers process jobs:
   - Gas Top-up Worker (high priority)
   - Consolidation Worker (after gas is sufficient)
   ↓
5. Cleanup Cron (every 10 minutes)
   - Marks stuck jobs as failed
   - Resets wallet flags for retry
```

## Setup

### 1. Database Migration

Run the database migrations to create the necessary tables and functions:

```bash
# Apply the migrations
supabase db push
```

### 2. Environment Variables

Ensure these environment variables are set in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
TRON_TRC20_CONTRACT=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
TRON_MNEMONIC=your_admin_wallet_mnemonic
```

### 3. Install Dependencies

```bash
npm install node-cron @types/node-cron concurrently
```

## Usage

### Start Complete System

```bash
npm run system:start
```

This runs all workers and cron jobs concurrently for a complete automated system.

### Start Individual Components

```bash
# Start all workers only
npm run worker:all

# Start all cron jobs only
npm run cron:all

# Start individual workers
npm run worker:new-sync-balances
npm run worker:new-gas-topup
npm run worker:new-consolidation

# Start individual cron jobs
npm run cron:balance-sync
npm run cron:queue-jobs
npm run cron:cleanup
```

## Configuration

### Constants (modifiable in worker files)

#### Sync Balances Worker
- `CONSOLIDATION_THRESHOLD`: 200 (USDT amount that triggers consolidation)
- `MIN_TRX_BALANCE`: 5 * 1e6 (5 TRX in sun units)
- `POLL_INTERVAL`: 5000ms (polling frequency)

#### Gas Top-up Worker
- `MIN_TRX_BALANCE`: 1 * 1e6 (1 TRX threshold)
- `TOPUP_AMOUNT`: 5 * 1e6 (5 TRX top-up amount)
- `RATE_LIMIT_MINUTES`: 10 (rate limiting)

#### Consolidation Worker
- `MIN_CONSOLIDATION_AMOUNT`: 100 (minimum USDT for consolidation)
- `MIN_TRX_BALANCE`: 1 * 1e6 (minimum TRX for fees)

#### Dependent Job Queue Cron
- `CRON_INTERVAL_MINUTES`: 5 (job queueing frequency)
- `MAX_JOBS_PER_BATCH`: 20 (limit jobs per batch)

#### Cleanup Cron
- `STUCK_THRESHOLD_MINUTES`: 10 (jobs stuck for cleanup)
- `CLEANUP_INTERVAL_MINUTES`: 10 (cleanup frequency)

## Monitoring

### Job Statistics

Query job statistics using the RPC function:

```sql
SELECT * FROM get_job_queue_stats();
```

### Manual Job Management

```sql
-- Retry failed jobs
SELECT retry_failed_jobs('gas-topup', 24);

-- Cleanup stuck jobs manually
SELECT cleanup_stuck_jobs(10);

-- View recent jobs
SELECT * FROM job_logs 
ORDER BY created_at DESC 
LIMIT 20;
```

### Wallet Status

```sql
-- Check wallets needing attention
SELECT address, on_chain_balance, trx_balance, needs_gas, needs_consolidation
FROM user_wallets 
WHERE needs_gas = true OR needs_consolidation = true;
```

## Job Types

### 1. Sync Jobs (`job_type = 'sync'`)
- **Trigger**: Cron every 5 minutes
- **Purpose**: Update wallet balances and flags
- **Sets**: `needs_gas` and `needs_consolidation` flags

### 2. Gas Top-up Jobs (`job_type = 'gas-topup'`)
- **Trigger**: Dependent job queue when `needs_gas = true`
- **Purpose**: Send TRX for transaction fees
- **Priority**: High (processed first)
- **Rate Limited**: Once per wallet per 10 minutes

### 3. Consolidation Jobs (`job_type = 'consolidation'`)
- **Trigger**: Dependent job queue when `needs_consolidation = true` AND `needs_gas = false`
- **Purpose**: Transfer USDT to admin wallet
- **Priority**: Normal (after gas requirements met)

### 4. Queue Summary Jobs
- **Trigger**: After each dependent job queueing cycle
- **Purpose**: Log queueing statistics and activity

## Smart Dependency Handling

The system intelligently handles job dependencies:

1. **Gas Priority**: Gas top-up jobs are always prioritized over consolidation
2. **Dependency Logic**: Consolidation only happens when wallet has sufficient gas
3. **Duplicate Prevention**: `createJobIfNotExists` helper prevents duplicate jobs
4. **Rate Limiting**: Built-in rate limiting prevents spam and ensures system stability
5. **Automatic Retry**: Failed jobs are automatically retried with exponential backoff

## Error Handling

### Retry Logic
- **Max Retries**: 3 attempts per job
- **Exponential Backoff**: Built into the polling intervals
- **Status Progression**: pending → active → completed/failed → retrying

### Common Issues

1. **TRX Balance Insufficient**
   - Solution: Ensure admin wallet has sufficient TRX
   - Monitor admin balance regularly

2. **Jobs Stuck in Active**
   - Solution: Cleanup cron runs every 10 minutes
   - Manual cleanup: `SELECT cleanup_stuck_jobs(10);`

3. **Rate Limiting**
   - Gas top-up is rate limited to prevent spam
   - Check rate limiting in worker logs

4. **Duplicate Jobs**
   - Automatic prevention using job ID uniqueness
   - Check existing pending/active jobs before creating new ones

## Security Considerations

1. **Database Access**
   - Uses service role key for database operations
   - RPC functions have proper permissions

2. **Private Keys**
   - Admin wallet derived from mnemonic
   - User wallets derived using HD wallet paths

3. **Job Locking**
   - Uses FOR UPDATE SKIP LOCKED to prevent race conditions
   - Multiple worker instances can run safely

4. **Rate Limiting**
   - Prevents abuse and ensures fair resource usage
   - Configurable per job type

## Troubleshooting

### Check System Status

```bash
# View complete system
npm run system:start

# Check individual components
npm run worker:new-sync-balances
npm run cron:queue-jobs
npm run cron:cleanup
```

### Database Queries

```sql
-- Check pending jobs by type
SELECT job_type, COUNT(*) as count 
FROM job_logs 
WHERE status = 'pending' 
GROUP BY job_type;

-- Check recent queueing activity
SELECT * FROM job_logs 
WHERE data->>'queue_summary' = 'true' 
ORDER BY created_at DESC 
LIMIT 5;

-- Check wallets with flags
SELECT address, needs_gas, needs_consolidation, 
       trx_balance, on_chain_balance, last_sync_at
FROM user_wallets 
WHERE needs_gas = true OR needs_consolidation = true;
```

### Performance Monitoring

- Monitor job processing times in the `data` field
- Check database connection pool usage
- Monitor TronWeb API call frequency
- Track queueing patterns and batch sizes

## Development

### Adding New Job Types

1. Add job type to database enum in migration
2. Create worker file following existing patterns
3. Add job queueing logic to dependent job queue cron
4. Add npm script to package.json
5. Update documentation

### Testing

```bash
# Test complete system
npm run system:start

# Test individual components
npm run cron:queue-jobs
# Check logs for proper job queueing

# Manual job creation for testing
INSERT INTO job_logs (job_id, job_type, status, wallet_address) 
VALUES ('test-gas-topup-123', 'gas-topup', 'pending', 'TR...');
```

This enhanced worker system provides a fully automated, intelligent solution for wallet management with proper dependency handling, monitoring, and error recovery mechanisms. 