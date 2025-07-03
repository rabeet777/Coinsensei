// src/app/api/trc20/create/route.ts
import { NextResponse }      from 'next/server'
import { supabaseAdmin }     from '@/lib/supabaseAdmin'
import { deriveTronAccount } from '@/lib/tronWallet'

export async function POST(request: Request) {
  // 1️⃣ Authenticate via Supabase JWT
  const authHeader = request.headers.get('authorization') ?? ''
  const token      = authHeader.split(' ')[1]
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2️⃣ If they already have a wallet, return it
  const { data: existing, error: existErr } = await supabaseAdmin
    .from('user_wallets')
    .select('address')
    .eq('user_id', user.id)
    .maybeSingle()
  if (existErr) {
    return NextResponse.json({ error: existErr.message }, { status: 500 })
  }
  if (existing) {
    return NextResponse.json({ address: existing.address })
  }

  // 3️⃣ Find the current highest id to derive a new unique index
  const { data: latest, error: latestErr } = await supabaseAdmin
    .from('user_wallets')
    .select('id')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (latestErr) {
    console.error('Error fetching latest wallet id:', latestErr)
    return NextResponse.json({ error: 'Could not determine next wallet index' }, { status: 500 })
  }
  const index = (latest?.id ?? 0) + 1

  // 4️⃣ Derive the address & path for that index with user-specific entropy
  let address: string, derivationPath: string
  try {
    ({ address, derivationPath } = await deriveTronAccount(index, user.id))
  } catch (err) {
    console.error('Error deriving Tron account:', err)
    return NextResponse.json({ error: 'Could not derive wallet address' }, { status: 500 })
  }

  // 5️⃣ Attempt to insert the new wallet row
  const { data: newRow, error: insertErr } = await supabaseAdmin
    .from('user_wallets')
    .insert({
      user_id:         user.id,
      address,
      derivation_path: derivationPath
    })
    .select('address')
    .single()

  if (insertErr) {
    // On a rare race, a duplicate-address error may occur.
    if ((insertErr as any).code === '23505') {
      // Fetch whatever address ended up in their row
      const { data: fallback, error: fallbackErr } = await supabaseAdmin
        .from('user_wallets')
        .select('address')
        .eq('user_id', user.id)
        .maybeSingle()
      if (fallbackErr || !fallback) {
        return NextResponse.json(
          { error: 'Wallet exists but could not retrieve it' },
          { status: 500 }
        )
      }
      return NextResponse.json({ address: fallback.address })
    }
    console.error('Error inserting wallet row:', insertErr)
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  // 6️⃣ Success! Return the freshly created address
  return NextResponse.json({ address: newRow.address })
}
