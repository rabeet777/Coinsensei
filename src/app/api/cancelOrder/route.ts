// src/app/api/cancelOrder/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { unlockBalance } from '@/services/walletService'
import { emitOrderBook, fetchCurrentOrderBook } from '@/services/tradeService'

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Get the order details first to calculate unlock amount
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending orders can be cancelled' },
        { status: 400 }
      )
    }

    // Calculate remaining unfilled amount (no fee calculation needed for unlocking)
    const filled = Number(order.filled) || 0
    const remaining = Number(order.amount) - filled

    if (remaining <= 0) {
      return NextResponse.json(
        { error: 'Order is already fully executed' },
        { status: 400 }
      )
    }

    // Update order status to cancelled
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order status:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel order' },
        { status: 500 }
      )
    }

    // Unlock the remaining balance (no fees were locked upfront)
    try {
      if (order.type === 'buy') {
        // For buy orders, unlock PKR: remaining amount * price
        const unlockAmount = remaining * Number(order.price)
        await unlockBalance(order.user_id, 'PKR', unlockAmount)
        console.log(`Unlocked ${unlockAmount} PKR for cancelled buy order`)
      } else {
        // For sell orders, unlock USDT: remaining amount
        const unlockAmount = remaining
        await unlockBalance(order.user_id, 'USDT', unlockAmount)
        console.log(`Unlocked ${unlockAmount} USDT for cancelled sell order`)
      }
    } catch (unlockError) {
      console.error('Error unlocking balance:', unlockError)
      // Don't fail the cancellation if unlock fails, just log it
    }

    // Immediately emit updated order book
    try {
      const updatedOrderBook = await fetchCurrentOrderBook()
      emitOrderBook(updatedOrderBook)
      console.log('✅ Emitted order book update after order cancellation')
    } catch (emitError) {
      console.error('Failed to emit order book update:', emitError)
      // Don't fail the request if socket emission fails
    }

    return NextResponse.json({ 
      message: 'Order cancelled successfully',
      unlocked_amount: order.type === 'buy' 
        ? remaining * Number(order.price)
        : remaining,
      currency: order.type === 'buy' ? 'PKR' : 'USDT'
    })

  } catch (error) {
    console.error('Cancel order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
