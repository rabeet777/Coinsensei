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

// Generate a mock TRON address
function generateMockTronAddress(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let address = 'T'
  for (let i = 0; i < 33; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return address
}

export async function POST(_request: NextRequest) {
  try {
    console.log('🔧 Starting generate_wallets job...')

    // Get all users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('user_profile')
      .select('uid')

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    // Get existing wallets
    const { data: existingWallets, error: walletsError } = await supabaseAdmin
      .from('user_wallets')
      .select('user_id')

    if (walletsError) {
      throw new Error(`Failed to fetch existing wallets: ${walletsError.message}`)
    }

    const existingUserIds = new Set(existingWallets?.map(w => w.user_id) || [])
    const usersWithoutWallets = users?.filter(user => !existingUserIds.has(user.uid)) || []

    console.log(`🔧 Found ${usersWithoutWallets.length} users without wallets`)

    let generatedCount = 0
    let errorCount = 0

    if (usersWithoutWallets.length > 0) {
      for (const user of usersWithoutWallets) {
        try {
          // Generate new wallet address
          const address = generateMockTronAddress()
          
          console.log(`🔧 Generating wallet for user ${user.uid}...`)
          
          // Simulate wallet generation delay
          await new Promise(resolve => setTimeout(resolve, 150))
          
          // Insert new wallet
          const { error: insertError } = await supabaseAdmin
            .from('user_wallets')
            .insert({
              user_id: user.uid,
              address: address,
              total_balance: 0,
              trx_balance: 10, // Start with some TRX for fees
              created_at: new Date().toISOString()
            })
          
          if (insertError) {
            throw insertError
          }
          
          generatedCount++
          console.log(`✅ Generated wallet for user ${user.uid}: ${address}`)
          
        } catch (error) {
          console.error(`❌ Failed to generate wallet for user ${user.uid}:`, error)
          errorCount++
        }
      }
    }

    console.log(`✅ Wallet generation completed: ${generatedCount} generated, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      message: `Wallet generation completed: ${generatedCount} new wallets created`,
      generatedCount,
      errorCount,
      totalUsers: users?.length || 0,
      usersWithoutWallets: usersWithoutWallets.length
    })

  } catch (error) {
    console.error('❌ Generate wallets job failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 