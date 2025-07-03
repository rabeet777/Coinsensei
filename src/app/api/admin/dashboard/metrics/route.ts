import { NextResponse } from 'next/server'
import { getMetrics }   from '@/lib/adminDashboard'

export async function GET() {
  try {
    const data = await getMetrics()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// optional: explicitly reject other methods
export async function POST() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
}
