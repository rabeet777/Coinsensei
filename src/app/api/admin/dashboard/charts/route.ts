import { NextResponse } from 'next/server'
import { getChartsData } from '@/lib/adminDashboard'

export async function GET() {
  try {
    const data = await getChartsData()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
}
