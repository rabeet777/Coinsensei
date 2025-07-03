import { NextResponse } from 'next/server'
import { getQueueStatus } from '@/lib/queues'

export async function GET() {
  try {
    const status = await getQueueStatus()
    return NextResponse.json(status)
  } catch (error) {
    console.error('Error getting queue status:', error)
    return NextResponse.json(
      { error: 'Failed to get queue status' },
      { status: 500 }
    )
  }
} 