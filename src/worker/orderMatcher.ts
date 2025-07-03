// src/worker/orderMatcher.ts

import { Worker, Job } from 'bullmq'
import { redisConnection } from '../lib/redis'
import { matchAndExecuteOrder, fetchCurrentOrderBook } from '../services/tradeService'
import { emitOrderBook } from '../websockets/orderBookSocket'

const worker = new Worker(
  'order-matching',
  async (job: Job) => {
    console.log(`▶️ Processing job ${job.id} with data:`, job.data)

    try {
      const { orderId } = job.data as { orderId: string }
      await matchAndExecuteOrder(orderId)
    } catch (err) {
      console.error(`❌ Error in matchAndExecuteOrder(${(job.data as { orderId: string }).orderId}):`, err)
      throw err
    }

    // Fetch fresh order book and broadcast
    let book
    try {
      book = await fetchCurrentOrderBook()
    } catch (err) {
      console.error('❌ Failed to fetch order book:', err)
      return
    }

    emitOrderBook(book)
    console.log(`✅ Emitted updated order book (job ${job.id})`)
  },
  {
    connection: redisConnection,
    concurrency: 1,
    lockDuration: 300_000,
  }
)

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err)
})

console.log('🔄 orderMatcher worker initialized and listening for jobs')
