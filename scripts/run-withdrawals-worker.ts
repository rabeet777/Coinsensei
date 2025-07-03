// scripts/run-withdrawals-worker.ts
import 'dotenv/config'
import '../src/jobs/withdrawals.worker.ts'

// once the module loads without throwing, log success:
console.log('✅ Withdrawals worker loaded and ready')
