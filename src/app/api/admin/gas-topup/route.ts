import { NextResponse } from 'next/server'
import { gasTopupQueue } from '@/lib/queues'

export async function POST() {
  try {
    await gasTopupQueue.add('topup', {}, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      }
    })
    return NextResponse.json({ message: 'Gas topup job queued successfully' })
  } catch (error) {
    console.error('Error queuing gas topup job:', error)
    return NextResponse.json({ error: 'Failed to queue gas topup job' }, { status: 500 })
  }
} 