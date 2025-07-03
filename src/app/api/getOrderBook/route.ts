// src/app/api/getOrderBook/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // buys: highest price first
    const { data: buy, error: buyErr } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .eq('type', 'buy')
      .order('price', { ascending: false })
      .order('created_at', { ascending: true })
    if (buyErr) throw buyErr

    // sells: lowest price first
    const { data: sell, error: sellErr } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .eq('type', 'sell')
      .order('price', { ascending: true })
      .order('created_at', { ascending: true })
    if (sellErr) throw sellErr

    return NextResponse.json({ buy, sell })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
