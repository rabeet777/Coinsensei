// src/app/api/admin/deposits/[id]/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin }            from '@/lib/supabaseAdmin'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: depositId } = await params

  // 1) Fetch the deposit record
  const { data: deposit, error: dErr } = await supabaseAdmin
    .from('user_pkr_deposits')
    .select('user_id, amount')
    .eq('id', depositId)
    .single()

  if (dErr || !deposit) {
    return NextResponse.json({ error: dErr?.message || 'Deposit not found' }, { status: 404 })
  }

  // 2) Increment the user’s PKR wallet balance
  const { error: wErr } = await supabaseAdmin
    .from('user_pkr_wallets')
    .upsert(
      [
        {
          user_id: deposit.user_id,
          // add to existing balance or insert new
          balance: deposit.amount
        }
      ],
      { onConflict: 'user_id' }
    )

  if (wErr) {
    return NextResponse.json({ error: wErr.message }, { status: 500 })
  }

  // 3) Mark the deposit confirmed
  const { error: uErr } = await supabaseAdmin
    
    .from('user_pkr_deposits')
    .update({
      status:     'confirmed',
      // admin_id:   /* remove until you wire up session */,
      updated_at: new Date().toISOString()
    })
    .eq('id', depositId)

  if (uErr) {
    return NextResponse.json({ error: uErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
