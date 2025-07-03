import { addGasTopupJob } from '@/lib/queues'

async function main() {
  try {
    const jobId = await addGasTopupJob()
    console.log(`Added gas top-up job: ${jobId}`)
  } catch (error) {
    console.error('Failed to add gas top-up job:', error)
    process.exit(1)
  }
}

main() 