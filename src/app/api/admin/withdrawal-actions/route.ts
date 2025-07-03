import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { addWithdrawalJob } from '@/lib/queues'

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

export async function POST(request: NextRequest) {
  try {
    const { withdrawalId, action, adminReason, adminUserId } = await request.json()

    if (!withdrawalId || !action) {
      return NextResponse.json(
        { error: 'withdrawalId and action are required' },
        { status: 400 }
      )
    }

    const validActions = ['approve', 'reject', 'retry', 'cancel']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    console.log(`🔧 Admin action: ${action} for withdrawal ${withdrawalId}`)

    // Get current withdrawal data
    const { data: withdrawal, error: fetchError } = await supabaseAdmin
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch withdrawal: ${fetchError.message}`)
    }

    if (!withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal not found' },
        { status: 404 }
      )
    }

    let updateData: any = {
      updated_at: new Date().toISOString()
    }

    switch (action) {
      case 'approve':
        if (withdrawal.status !== 'pending') {
          return NextResponse.json(
            { error: 'Only pending withdrawals can be approved' },
            { status: 400 }
          )
        }

        // For external transfers, add to queue
        if (withdrawal.type === 'onchain') {
          updateData.status = 'processing'
          
          // Update withdrawal first
          const { error: updateError } = await supabaseAdmin
            .from('withdrawals')
            .update(updateData)
            .eq('id', withdrawalId)

          if (updateError) {
            throw new Error(`Failed to update withdrawal: ${updateError.message}`)
          }

          // Add to processing queue
          try {
            const jobData = {
              withdrawalId: withdrawal.id,
              user_id: withdrawal.user_id,
              to_address: withdrawal.to_address,
              amount: withdrawal.amount,
              fee: withdrawal.fee
            }
            
            await addWithdrawalJob(jobData)
            console.log(`✅ Withdrawal ${withdrawalId} approved and queued for processing`)
          } catch (queueError) {
            console.error('Failed to queue withdrawal:', queueError)
            // Revert status if queueing fails
            await supabaseAdmin
              .from('withdrawals')
              .update({ status: 'pending' })
              .eq('id', withdrawalId)
            throw new Error('Failed to queue withdrawal for processing')
          }
        } else {
          // Internal transfers are already completed
          updateData.status = 'completed'
          
          const { error: updateError } = await supabaseAdmin
            .from('withdrawals')
            .update(updateData)
            .eq('id', withdrawalId)

          if (updateError) {
            throw new Error(`Failed to update withdrawal: ${updateError.message}`)
          }
        }
        break

      case 'reject':
        if (!['pending', 'processing'].includes(withdrawal.status)) {
          return NextResponse.json(
            { error: 'Only pending or processing withdrawals can be rejected' },
            { status: 400 }
          )
        }

        updateData.status = 'cancelled'
        updateData.error_message = adminReason || 'Rejected by admin'

        // Refund the amount to user's balance
        const { data: userWallet, error: walletError } = await supabaseAdmin
          .from('user_wallets')
          .select('balance')
          .eq('user_id', withdrawal.user_id)
          .single()

        if (walletError) {
          throw new Error(`Failed to fetch user wallet: ${walletError.message}`)
        }

        const refundAmount = withdrawal.amount + withdrawal.fee
        const newBalance = Number(userWallet.balance) + refundAmount

        // Start transaction
        const { error: txError } = await supabaseAdmin.rpc('begin_transaction')
        if (txError) throw txError

        try {
          // Update withdrawal status
          await supabaseAdmin
            .from('withdrawals')
            .update(updateData)
            .eq('id', withdrawalId)

          // Refund to user balance
          await supabaseAdmin
            .from('user_wallets')
            .update({ balance: newBalance })
            .eq('user_id', withdrawal.user_id)

          await supabaseAdmin.rpc('commit_transaction')
          console.log(`✅ Withdrawal ${withdrawalId} rejected and ${refundAmount} USDT refunded`)
        } catch (err) {
          await supabaseAdmin.rpc('rollback_transaction')
          throw err
        }
        break

      case 'retry':
        if (withdrawal.status !== 'failed') {
          return NextResponse.json(
            { error: 'Only failed withdrawals can be retried' },
            { status: 400 }
          )
        }

        updateData.status = 'processing'
        updateData.error_message = null

        // Update withdrawal first
        const { error: retryUpdateError } = await supabaseAdmin
          .from('withdrawals')
          .update(updateData)
          .eq('id', withdrawalId)

        if (retryUpdateError) {
          throw new Error(`Failed to update withdrawal: ${retryUpdateError.message}`)
        }

        // Add back to queue for retry
        try {
          const jobData = {
            withdrawalId: withdrawal.id,
            user_id: withdrawal.user_id,
            to_address: withdrawal.to_address,
            amount: withdrawal.amount,
            fee: withdrawal.fee
          }
          
          await addWithdrawalJob(jobData)
          console.log(`🔄 Withdrawal ${withdrawalId} queued for retry`)
        } catch (queueError) {
          console.error('Failed to queue retry:', queueError)
          // Revert status if queueing fails
          await supabaseAdmin
            .from('withdrawals')
            .update({ status: 'failed' })
            .eq('id', withdrawalId)
          throw new Error('Failed to queue withdrawal for retry')
        }
        break

      case 'cancel':
        if (!['pending', 'processing'].includes(withdrawal.status)) {
          return NextResponse.json(
            { error: 'Only pending or processing withdrawals can be cancelled' },
            { status: 400 }
          )
        }

        updateData.status = 'cancelled'
        updateData.error_message = adminReason || 'Cancelled by admin'

        // Refund logic same as reject
        const { data: userWalletCancel, error: walletCancelError } = await supabaseAdmin
          .from('user_wallets')
          .select('balance')
          .eq('user_id', withdrawal.user_id)
          .single()

        if (walletCancelError) {
          throw new Error(`Failed to fetch user wallet: ${walletCancelError.message}`)
        }

        const cancelRefundAmount = withdrawal.amount + withdrawal.fee
        const cancelNewBalance = Number(userWalletCancel.balance) + cancelRefundAmount

        // Start transaction
        const { error: cancelTxError } = await supabaseAdmin.rpc('begin_transaction')
        if (cancelTxError) throw cancelTxError

        try {
          // Update withdrawal status
          await supabaseAdmin
            .from('withdrawals')
            .update(updateData)
            .eq('id', withdrawalId)

          // Refund to user balance
          await supabaseAdmin
            .from('user_wallets')
            .update({ balance: cancelNewBalance })
            .eq('user_id', withdrawal.user_id)

          await supabaseAdmin.rpc('commit_transaction')
          console.log(`❌ Withdrawal ${withdrawalId} cancelled and ${cancelRefundAmount} USDT refunded`)
        } catch (err) {
          await supabaseAdmin.rpc('rollback_transaction')
          throw err
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Log admin action for audit trail
    try {
      await supabaseAdmin
        .from('admin_actions')
        .insert({
          admin_user_id: adminUserId || 'system',
          action_type: 'withdrawal_' + action,
          target_id: withdrawalId,
          target_type: 'withdrawal',
          details: {
            withdrawal_id: withdrawalId,
            action: action,
            reason: adminReason,
            original_status: withdrawal.status,
            new_status: updateData.status || withdrawal.status
          },
          created_at: new Date().toISOString()
        })
    } catch (auditError) {
      console.error('Failed to log admin action:', auditError)
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json({
      success: true,
      message: `Withdrawal ${action}ed successfully`,
      withdrawalId,
      action,
      newStatus: updateData.status || withdrawal.status
    })

  } catch (error) {
    console.error('❌ Withdrawal action failed:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 