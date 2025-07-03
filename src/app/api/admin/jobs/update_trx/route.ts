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
    console.log('🔄 Starting update_trx job...')

    // Get all user wallets
    const { data: wallets, error: walletsError } = await supabaseAdmin
      .from('user_wallets')
      .select('id, user_id, address, trx_balance')

    if (walletsError) {
      throw new Error(`Failed to fetch wallets: ${walletsError.message}`)
    }

    console.log(`🔄 Updating TRX balance for ${wallets?.length || 0} wallets`)

    let updatedCount = 0
    let errorCount = 0

    if (wallets) {
      for (const wallet of wallets) {
        try {
          // Placeholder for actual TRX balance API call
          // const actualTrxBalance = await getTronBalance(wallet.address)
          
          console.log(`🔄 Updating TRX balance for wallet ${wallet.address}...`)
          
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 75))
          
          // Simulate TRX balance (between 0-50 TRX)
          const newTrxBalance = Math.floor(Math.random() * 50)
          
          // Update TRX balance in database
          const { error: updateError } = await supabaseAdmin
            .from('user_wallets')
            .update({ trx_balance: newTrxBalance })
            .eq('id', wallet.id)
          
          if (updateError) {
            throw updateError
          }
          
          updatedCount++
          console.log(`✅ Updated TRX balance for wallet ${wallet.address}: ${newTrxBalance} TRX`)
          
        } catch (error) {
          console.error(`❌ Failed to update TRX balance for wallet ${wallet.address}:`, error)
          errorCount++
        }
      }
    }

    console.log(`✅ TRX balance update completed: ${updatedCount} updated, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      message: `TRX balance update completed: ${updatedCount} wallets updated`,
      updatedCount,
      errorCount,
      totalWallets: wallets?.length || 0
    })

  } catch (error) {
    console.error('❌ Update TRX job failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 