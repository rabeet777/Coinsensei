import { addSyncBalancesJob } from '@/lib/queues'

async function main() {
  try {
    console.log('Adding sync balances job...')
    const job = await addSyncBalancesJob()
    console.log('Job added successfully:', job.id)
    process.exit(0)
  } catch (error) {
    console.error('Failed to add job:', error)
    process.exit(1)
  }
}

main() 