import 'dotenv/config'
import { Worker } from 'bullmq'
import { redisConnection } from '@/lib/redis'

console.log('Starting consolidation worker...')

// Initialize worker
const worker = new Worker('consolidation', async job => {
  console.log(`Processing job ${job.id} of type ${job.name}`)
  
  if (job.name === 'consolidate') {
    // For now, just log - the actual consolidation logic will be implemented
    console.log('Consolidation job received but implementation is in separate worker')
  }
}, {
  connection: redisConnection,
  concurrency: 1
})

// Worker event handlers
worker.on('completed', job => {
  console.log(`Job ${job.id} completed successfully`)
})

worker.on('failed', (job, error) => {
  console.error(`Job ${job?.id} failed:`, error)
})

worker.on('error', error => {
  console.error('Worker error:', error)
})

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

console.log('Consolidation worker started and ready to process jobs')
