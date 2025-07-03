import { addConsolidationJob } from '@/lib/queues'

async function main() {
  try {
    console.log('Adding consolidation job...')
    const job = await addConsolidationJob()
    console.log('Job added successfully:', job.id)
    process.exit(0)
  } catch (error) {
    console.error('Failed to add job:', error)
    process.exit(1)
  }
}

main() 