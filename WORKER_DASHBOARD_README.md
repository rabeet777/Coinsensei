# Admin Worker Dashboard

A complete admin dashboard to monitor and manage background workers for gas top-up, balance sync, deposit detection, and consolidation in a crypto wallet system using Supabase and BullMQ.

## 🏗️ Architecture

The admin worker dashboard is built with:

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS, and shadcn/ui
- **Backend**: Node.js with BullMQ for job queuing and Redis for job state management
- **Database**: Supabase (PostgreSQL) for job logs and wallet management
- **Architecture**: Event-driven + flag-based job queuing using `needs_consolidation` and `needs_gas` flags

## 📁 Project Structure

```
src/
├── app/
│   ├── admin/workers/                    # Admin worker pages
│   │   ├── page.tsx                      # Main worker dashboard
│   │   └── jobs/[id]/page.tsx           # Job details page
│   └── api/                             # API endpoints
│       ├── dispatch/                    # Job dispatch endpoints
│       │   ├── gas-topup/route.ts
│       │   ├── consolidation/route.ts
│       │   └── sync/route.ts
│       ├── jobs/                        # Job management endpoints
│       │   ├── list/route.ts
│       │   ├── retry/route.ts
│       │   └── [id]/route.ts
│       ├── wallets/                     # Wallet management endpoints
│       │   ├── list/route.ts
│       │   └── set-flags/route.ts
│       └── workers/
│           └── stats/route.ts           # Worker statistics
├── components/admin/                    # Admin UI components
│   ├── WorkerStats.tsx                  # Worker status cards
│   ├── WalletTable.tsx                  # Wallet management table
│   ├── JobLogsTable.tsx                 # Job logs with filtering
│   ├── JobDetailsCard.tsx               # Detailed job information
│   ├── TriggerJobModal.tsx              # Manual job triggering
│   ├── RetryFailedJobModal.tsx          # Job retry interface
│   ├── WorkerStatusBadge.tsx            # Status indicator badges
│   └── FlagBadges.tsx                   # Wallet flag indicators
├── types/worker.ts                      # TypeScript definitions
└── worker/                              # Background workers
    ├── consolidation.worker.ts          # Consolidation jobs
    ├── gas-topup.worker.ts             # Gas top-up jobs
    └── sync-balances.ts               # Balance sync jobs
```

## 🚀 Features

### Dashboard Overview
- **Worker Statistics**: Real-time stats showing active, failed, queued, and completed jobs per worker
- **Worker Status Indicators**: Visual status badges (Active, Idle, Error, Stopped)
- **Last Activity Tracking**: Monitor when each worker last processed a job

### Wallet Management
- **Wallet Table**: View all wallets with addresses, balances, and current flags
- **Flag Management**: Visual indicators for `needs_consolidation` and `needs_gas` flags
- **Manual Job Triggering**: Trigger gas top-up, consolidation, or sync jobs for specific wallets
- **Filtering**: Filter wallets by flags, network, balance range

### Job Monitoring
- **Job Logs Table**: Comprehensive view of all background jobs
- **Advanced Filtering**: Filter by status, job type, trigger source, date range
- **Job Details**: Detailed view of individual jobs including error messages and execution data
- **Retry Management**: Retry failed jobs with option to reset retry count

### Manual Controls
- **Job Dispatch**: Manually trigger jobs through the API or UI
- **Priority Setting**: Set job priority (Low, Normal, High)
- **Retry Controls**: Retry failed jobs with customizable retry count reset

## 📋 Database Schema

### Job Logs Table (`job_logs`)
```sql
- id: UUID (Primary Key)
- job_id: VARCHAR(255) (Unique identifier from job queue)
- job_type: VARCHAR(50) (gas-topup, consolidation, sync, deposit-detection)
- status: VARCHAR(20) (pending, active, completed, failed, retrying)
- wallet_address: VARCHAR(255)
- user_id: UUID
- triggered_by: VARCHAR(20) (system, manual, deposit, schedule)
- data: JSONB (Job-specific data)
- error_message: TEXT
- started_at: TIMESTAMPTZ
- completed_at: TIMESTAMPTZ
- retry_count: INTEGER
- max_retries: INTEGER
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Wallets Table (`user_wallets`)
```sql
- id: UUID (Primary Key)
- user_id: UUID
- address: VARCHAR(255) (Unique)
- balance: DECIMAL(32,18)
- network: VARCHAR(50)
- needs_consolidation: BOOLEAN (added by migration)
- needs_gas: BOOLEAN (added by migration)
- last_sync: TIMESTAMPTZ (added by migration)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

## 🔧 Setup Instructions

### 1. Database Migration
Run the SQL migration to create required tables and update your existing `user_wallets` table:

```bash
# Apply the migration file - this will create job_logs table and add flags to existing user_wallets
psql -f supabase/migrations/20241201_create_worker_tables.sql
```

### 2. Environment Variables
Ensure these environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
REDIS_URL=your_redis_url
```

### 3. Install Dependencies
The required dependencies are already in `package.json`:

```bash
npm install
```

### 4. Start the Application
```bash
# Development
npm run dev

# Production
npm run build && npm start
```

## 📡 API Endpoints

### Job Dispatch
- `POST /api/dispatch/gas-topup` - Trigger gas top-up job
- `POST /api/dispatch/consolidation` - Trigger consolidation job
- `POST /api/dispatch/sync` - Trigger balance sync job

### Job Management
- `GET /api/jobs/list?status=failed&job_type=gas-topup` - List jobs with filters
- `POST /api/jobs/retry` - Retry a failed job
- `GET /api/jobs/[id]` - Get job details

### Wallet Management
- `GET /api/wallets/list?needs_gas=true` - List wallets with filters
- `POST /api/wallets/set-flags` - Update wallet flags

### Worker Statistics
- `GET /api/workers/stats` - Get worker statistics

## 💡 Usage Examples

### Triggering a Manual Gas Top-up
```javascript
const response = await fetch('/api/dispatch/gas-topup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    wallet_address: 'TRX1234567890abcdef...',
    user_id: 'user-uuid',
    priority: 10, // High priority
    triggered_by: 'manual'
  })
});
```

### Retrying a Failed Job
```javascript
const response = await fetch('/api/jobs/retry', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    job_id: 'job-uuid',
    reset_retry_count: true // Start fresh with 0 retries
  })
});
```

### Setting Wallet Flags
```javascript
const response = await fetch('/api/wallets/set-flags', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    wallet_address: 'TRX1234567890abcdef...',
    flags: {
      needs_consolidation: true,
      needs_gas: false
    }
  })
});
```

## 🔄 Worker Integration

### Existing Workers
The dashboard integrates with your existing workers:
- `src/worker/gas-topup.worker.ts`
- `src/worker/consolidation.worker.ts`
- `src/worker/sync-balances.ts`

### Adding Job Logging to Workers
Update your workers to log job status changes:

```typescript
// Example in gas-topup.worker.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function updateJobStatus(jobId: string, status: string, errorMessage?: string) {
  await supabase
    .from('job_logs')
    .update({
      status,
      error_message: errorMessage,
      started_at: status === 'active' ? new Date().toISOString() : undefined,
      completed_at: ['completed', 'failed'].includes(status) ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString()
    })
    .eq('job_id', jobId);
}

// Example: Update wallet flags when consolidation is needed
async function setWalletFlags(walletAddress: string, flags: { needs_consolidation?: boolean; needs_gas?: boolean }) {
  await supabase
    .from('user_wallets')
    .update({
      ...flags,
      updated_at: new Date().toISOString()
    })
    .eq('address', walletAddress);
}
```

## 🎨 UI Components

### WorkerStats
Displays worker status cards with job counts and activity indicators.

### WalletTable
Interactive table showing wallets with filtering and job triggering capabilities.

### JobLogsTable
Comprehensive job listing with advanced filtering and retry options.

### TriggerJobModal
Modal interface for manually triggering jobs with priority selection.

### RetryFailedJobModal
Specialized interface for retrying failed jobs with retry count management.

## 🔐 Security Considerations

- All API endpoints use Supabase service role key for database access
- Input validation on all endpoints
- Proper error handling and logging
- Rate limiting should be implemented for production use

## 📊 Monitoring & Alerts

The dashboard provides real-time monitoring capabilities:

- **Worker Health**: Monitor active/idle/error states
- **Job Success Rates**: Track completion vs failure rates
- **Performance Metrics**: Job execution times and retry patterns
- **Alert Triggers**: Failed job counts, stuck workers, high retry rates

## 🚀 Production Deployment

For production deployment:

1. Set up proper database indexes (included in migration)
2. Configure Redis for job queue persistence
3. Set up monitoring and alerting
4. Implement rate limiting for API endpoints
5. Set up log aggregation for worker processes
6. Configure backup strategies for job logs

## 🤝 Contributing

To extend the dashboard:

1. Add new job types in `src/types/worker.ts`
2. Create corresponding dispatch endpoints in `src/app/api/dispatch/`
3. Update worker statistics endpoint to include new job types
4. Add UI components for new job types in `src/components/admin/`

## 📞 Support

For issues or questions regarding the admin worker dashboard:

1. Check the job logs table for detailed error messages
2. Monitor worker statistics for performance issues
3. Use the retry functionality for transient failures
4. Check Redis connection and job queue health

The dashboard provides comprehensive tools for monitoring and managing your crypto wallet worker system, ensuring reliable operation of critical background processes. 