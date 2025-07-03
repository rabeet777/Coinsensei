import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const cookiesStore = cookies
    const supabase = createRouteHandlerClient({ cookies: cookiesStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { recipientAddress, amount, notes } = body

    // Validate input
    if (!recipientAddress || !amount) {
      return NextResponse.json({ 
        error: 'Recipient address and amount are required' 
      }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ 
        error: 'Amount must be positive' 
      }, { status: 400 })
    }

    if (amount < 100) {
      return NextResponse.json({ 
        error: 'Minimum transfer amount is PKR 100' 
      }, { status: 400 })
    }

    // Check if user account is locked
    const { data: senderProfile } = await supabaseAdmin
      .from('user_profile')
      .select('is_locked')
      .eq('uid', user.id)
      .single()

    if (senderProfile?.is_locked) {
      return NextResponse.json({ 
        error: 'Your account is locked. Contact support.' 
      }, { status: 403 })
    }

    // Get sender's wallet (should already exist from signup)
    const { data: senderWallet, error: senderError } = await supabaseAdmin
      .from('user_pkr_wallets')
      .select('balance, locked_balance, address')
      .eq('user_id', user.id)
      .single()

    if (senderError || !senderWallet) {
      return NextResponse.json({ 
        error: 'Sender wallet not found' 
      }, { status: 404 })
    }

    // Ensure sender has an address (if missing, generate one)
    if (!senderWallet.address) {
      const { data: newAddress, error: addressError } = await supabaseAdmin.rpc('ensure_user_pkr_address', {
        user_id: user.id
      })
      
      if (addressError) {
        return NextResponse.json({ 
          error: 'Failed to generate sender address' 
        }, { status: 500 })
      }
      
      senderWallet.address = newAddress
    }

    // Check if sender has sufficient balance
    if (senderWallet.balance < amount) {
      return NextResponse.json({ 
        error: 'Insufficient balance' 
      }, { status: 400 })
    }

    // Check if sender is not trying to send to themselves
    if (senderWallet.address === recipientAddress) {
      return NextResponse.json({ 
        error: 'Cannot transfer to your own address' 
      }, { status: 400 })
    }

    // Find recipient wallet
    const { data: recipientWallet, error: recipientError } = await supabaseAdmin
      .from('user_pkr_wallets')
      .select('user_id, balance, address')
      .eq('address', recipientAddress)
      .single()

    if (recipientError || !recipientWallet) {
      return NextResponse.json({ 
        error: 'Recipient address not found' 
      }, { status: 404 })
    }

    // Check if recipient account is locked
    const { data: recipientProfile } = await supabaseAdmin
      .from('user_profile')
      .select('is_locked')
      .eq('uid', recipientWallet.user_id)
      .single()

    if (recipientProfile?.is_locked) {
      return NextResponse.json({ 
        error: 'Recipient account is locked' 
      }, { status: 403 })
    }

    // Perform the transfer using database transaction
    const { data: transferResult, error: transferError } = await supabaseAdmin.rpc(
      'transfer_pkr',
      {
        sender_id: user.id,
        recipient_id: recipientWallet.user_id,
        transfer_amount: amount,
        transfer_notes: notes || null
      }
    )

    if (transferError) {
      console.error('Transfer error:', transferError)
      return NextResponse.json({ 
        error: 'Transfer failed. Please try again.' 
      }, { status: 500 })
    }

    // Get updated sender balance
    const { data: updatedSenderWallet } = await supabaseAdmin
      .from('user_pkr_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Transfer completed successfully',
      transferId: transferResult,
      newBalance: updatedSenderWallet?.balance || 0,
      details: {
        amount: amount,
        recipientAddress: recipientAddress,
        notes: notes || null,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('PKR transfer error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 