// src/app/api/user/deposits/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  // initialize a Supabase client that reads the user session from the cookie
  // Handle cookies properly for Next.js 15+ compatibility
  const cookiesStore = cookies
  const supabase = createRouteHandlerClient({ cookies: cookiesStore })
  
  // 1) verify logged‑in user
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // 2) parse & validate payload
  let payload: { amount: number }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { amount } = payload
  if (typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  // 3) insert the deposit row (RLS will ensure user_id = auth.uid())
  const { data, error } = await supabase
    .from('user_pkr_deposits')
    .insert([{ user_id: user.id, amount }])
    .select()   // return the inserted row
    .single()

  if (error) {
    console.error('Deposit insert error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 4) respond with the new deposit
  return NextResponse.json({ deposit: data })
}
