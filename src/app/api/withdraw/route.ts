import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { addWithdrawalJob, addConsolidationJob, addGasTopupJob } from '@/lib/queues'

const {
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
} = process.env

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase configuration')
}

const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req: Request) {
  try {
    const { user_id, to_address, amount, fee } = await req.json()

    // Validate input
    if (!user_id || !to_address || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      )
    }

    // Create withdrawal record
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .insert({
        user_id,
        to_address,
        amount,
        fee,
        status: 'pending'
      })
      .select()
      .single()

    if (withdrawalError || !withdrawal) {
      console.error('Failed to create withdrawal:', withdrawalError)
      return NextResponse.json(
        { error: 'Failed to create withdrawal' },
        { status: 500 }
      )
    }

    // Add withdrawal job
    await addWithdrawalJob({
      withdrawalId: withdrawal.id,
      user_id,
      to_address,
      amount,
      fee
    })

    // Add consolidation job
    await addConsolidationJob()

    // Add gas topup job
    await addGasTopupJob()

    return NextResponse.json({
      message: 'Withdrawal request submitted',
      withdrawal_id: withdrawal.id
    })
  } catch (error) {
    console.error('Error processing withdrawal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 