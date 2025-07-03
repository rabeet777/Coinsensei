// src/app/api/placeOrder/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { lockBalance, calculateTradingFee } from '../../../services/walletService'
import { addOrderJob } from '@/lib/queues'
import { emitOrderBook, fetchCurrentOrderBook } from '@/services/tradeService'

export async function POST(req: NextRequest) {
  try {
    const { user_id, type, price, amount } = await req.json()

    // Validate input
    if (!user_id || !type || !price || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (price <= 0 || amount <= 0) {
      return NextResponse.json(
        { error: 'Price and amount must be greater than 0' },
        { status: 400 }
      )
    }

    if (type !== 'buy' && type !== 'sell') {
      return NextResponse.json(
        { error: 'Invalid order type. Must be either "buy" or "sell"' },
        { status: 400 }
      )
    }

    // Calculate trading fee (0.15% on USDT amount) for display purposes
    const tradingFee = calculateTradingFee(amount)

    try {
      // Lock balance WITHOUT fees - fees will be deducted after execution
      if (type === 'buy') {
        // Buyer locks PKR for the full amount (no fee upfront)
        await lockBalance(user_id, 'PKR', price * amount)
      } else {
        // Seller locks USDT for the full amount (no fee upfront)  
        await lockBalance(user_id, 'USDT', amount)
      }
      
      console.log(`Locked ${type === 'buy' ? price * amount + ' PKR' : amount + ' USDT'} for ${type} order`)
    } catch (err: any) {
      if (err.message === 'Insufficient available balance') {
        return NextResponse.json(
          { error: `Insufficient balance. You need ${type === 'buy' 
            ? `₨${(price * amount).toFixed(2)} PKR` 
            : `${amount.toFixed(6)} USDT`}` },
          { status: 400 }
        )
      }
      throw err
    }

    // Create order with fee information for tracking
    const { data: order, error } = await supabase
      .from('orders')
      .insert({ 
        user_id, 
        type, 
        price, 
        amount, 
        filled: 0, 
        status: 'pending',
        fee_amount: tradingFee,
        fee_currency: 'USDT'
      })
      .select('*')
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    // Immediately emit updated order book
    try {
      const updatedOrderBook = await fetchCurrentOrderBook()
      emitOrderBook(updatedOrderBook)
      console.log('✅ Emitted order book update after new order placement')
    } catch (emitError) {
      console.error('Failed to emit order book update:', emitError)
      // Don't fail the request if socket emission fails
    }

    // enqueue matching job
    try {
      await addOrderJob(order.id)
    } catch (err) {
      console.error('Failed to enqueue order:', err)
      // Don't fail the request if job enqueuing fails
    }

    return NextResponse.json({ 
      order,
      fee_info: {
        fee_amount: tradingFee,
        fee_rate: '0.15%',
        message: type === 'buy' 
          ? `You will receive ${(amount - tradingFee).toFixed(6)} USDT after 0.15% fee`
          : `You will receive ₨${((amount - tradingFee) * price).toFixed(2)} after 0.15% fee`
      }
    })
  } catch (err: any) {
    console.error('Place order error:', err)
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

