import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(_request: NextRequest) {
  try {
    console.log('⚡ Starting process_withdrawals job...')

    // Get pending withdrawals
    const { data: withdrawals, error: withdrawalsError } = await supabaseAdmin
      .from('withdrawals')
      .select('id, user_id, amount, to_address, status')
      .eq('status', 'pending')

    if (withdrawalsError) {
      throw new Error(`Failed to fetch withdrawals: ${withdrawalsError.message}`)
    }

    console.log(`⚡ Found ${withdrawals?.length || 0} pending withdrawals`)

    let processedCount = 0
    let errorCount = 0

    if (withdrawals && withdrawals.length > 0) {
      for (const withdrawal of withdrawals) {
        try {
          // Placeholder for actual withdrawal processing logic
          // const txHash = await processWithdrawal(withdrawal)
          
          console.log(`⚡ Processing withdrawal ${withdrawal.id} for $${withdrawal.amount}...`)
          
          // Simulate processing delay
          await new Promise(resolve => setTimeout(resolve, 200))
          
          // Simulate success/failure (90% success rate)
          const success = Math.random() < 0.9
          
          if (success) {
            // Update withdrawal status to completed
            const { error: updateError } = await supabaseAdmin
              .from('withdrawals')
              .update({ 
                status: 'completed',
                tx_id: `simulated_tx_${Date.now()}_${withdrawal.id}`
              })
              .eq('id', withdrawal.id)
            
            if (updateError) {
              throw updateError
            }
            
            processedCount++
            console.log(`✅ Withdrawal ${withdrawal.id} processed successfully`)
          } else {
            // Mark as failed
            const { error: updateError } = await supabaseAdmin
              .from('withdrawals')
              .update({ status: 'failed' })
              .eq('id', withdrawal.id)
            
            if (updateError) {
              throw updateError
            }
            
            errorCount++
            console.log(`❌ Withdrawal ${withdrawal.id} failed`)
          }
          
        } catch (error) {
          console.error(`❌ Failed to process withdrawal ${withdrawal.id}:`, error)
          errorCount++
        }
      }
    }

    console.log(`✅ Withdrawal processing completed: ${processedCount} processed, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      message: `Withdrawal processing completed: ${processedCount} successful, ${errorCount} failed`,
      processedCount,
      errorCount,
      totalWithdrawals: withdrawals?.length || 0
    })

  } catch (error) {
    console.error('❌ Process withdrawals job failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 