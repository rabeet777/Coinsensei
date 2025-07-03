import { NextResponse } from 'next/server'
import { syncBalancesQueue } from '@/lib/queues'

export async function POST() {
  try {
    await syncBalancesQueue.add('sync', {}, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      }
    })
    return NextResponse.json({ message: 'Sync balances job queued successfully' })
  } catch (error) {
    console.error('Error queuing sync balances job:', error)
    return NextResponse.json({ error: 'Failed to queue sync balances job' }, { status: 500 })
  }
} 