// src/services/tradeService.ts

import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  deductLockedBalance,
  creditBalance,
  collectTradingFee,
  calculateTradingFee,
} from './walletService'
import { emitOrderBook as _emitOrderBook } from '../websockets/orderBookSocket'

// Re-export emitOrderBook for use in APIs
export { emitOrderBook } from '../websockets/orderBookSocket'

/**
 * Matches & settles a single incoming order (orderId) against existing
 * opposite–side orders at matching prices. Supports partial matching.
 * Now includes 0.15% trading fee collection.
 */
export async function matchAndExecuteOrder(orderId: string) {
  // ――― Step 1: Load the incoming order from the DB ―――
  const {
    data: incomingOrder,
    error: fetchErr,
  } = await supabase
    .from('orders')
    .select('id, user_id, type, price, amount, filled, status, fee_amount')
    .eq('id', orderId)
    .single()

  if (fetchErr || !incomingOrder) {
    console.error('Failed to fetch incoming order:', fetchErr)
    return
  }
  // If it's not still 'pending', do nothing
  if (incomingOrder.status !== 'pending') {
    return
  }

  // ――― Step 2: Compute how much is still unfilled ―――
  let filledSoFar = Number(incomingOrder.filled)      // e.g. 0
  let remaining   = Number(incomingOrder.amount) - filledSoFar  // e.g. 25 if amount=25

  if (remaining <= 0) {
    return
  }

  // ――― Step 3: Fetch matching counter–orders via a Postgres RPC or raw SQL ―――
  // match_orders_rpc should return only those 'pending' orders on the opposite side
  const { data: counters, error: rpcErr } = await supabase.rpc(
    'match_orders_rpc',
    {
      p_order_id: orderId,
      p_price:    incomingOrder.price,
      p_amount:   remaining,
    }
  )
  if (rpcErr) {
    console.error('Error fetching matching orders via RPC:', rpcErr)
    return
  }
  if (!counters || (counters as any[]).length === 0) {
    // No counters to match, leave incomingOrder as 'pending'
    return
  }

  // ――― Step 4: Loop through each counter (in best price/time priority) ―――
  for (const counter of (counters as any[])) {
    if (remaining <= 0) break

    const counterAlreadyFilled = Number(counter.filled)     // e.g. 0
    const counterTotalAmount   = Number(counter.amount)     // e.g. 50
    const counterAvailable     = counterTotalAmount - counterAlreadyFilled  // e.g. 50

    if (counterAvailable <= 0) {
      // Nothing left on this counter order (shouldn't happen if RPC is correct)
      continue
    }

    // ――― Step 4a: Determine trade volume (partial or full) ―――
    const tradeAmt   = Math.min(remaining, counterAvailable)
      // e.g. tradeAmt = min(25,50) = 25
    const tradePrice = Number(counter.price)  // 289
    remaining       -= tradeAmt               // now remaining = 0

    // ――― Step 4b: Update the COUNTER order's filled & status in `orders` ―――
    const newCounterFilled = counterAlreadyFilled + tradeAmt
      // e.g. 0 + 25 = 25
    // If we have now filled the entire counter order (25≥50? false), status remains 'pending'.
    // Only if newCounterFilled ≥ totalAmount (50) do we mark 'executed'.
    const counterStatus = newCounterFilled >= counterTotalAmount ? 'executed' : 'pending'

    const { error: counterUpdateErr } = await supabase
      .from('orders')
      .update({
        filled:      newCounterFilled.toString(),
        status:      counterStatus,            // e.g. 'pending'
        executed_at: newCounterFilled >= counterTotalAmount
                      ? new Date().toISOString()
                      : null,
      })
      .eq('id', counter.id)

    if (counterUpdateErr) {
      console.error(`Failed to update counter order ${counter.id}:`, counterUpdateErr)
      throw counterUpdateErr
    }

    // ――― Step 4c: Update the INCOMING order's filled & status in `orders` ―――
    filledSoFar += tradeAmt
      // e.g. filledSoFar = 0 + 25 = 25
    // If the incoming order is now fully filled (25≥25 true), mark executed.
    const incomingStatus = filledSoFar >= Number(incomingOrder.amount)
      ? 'executed'
      : 'pending'

    const { error: incomingUpdateErr } = await supabase
      .from('orders')
      .update({
        filled:      filledSoFar.toString(),
        status:      incomingStatus,           // e.g. 'executed'
        executed_at: filledSoFar >= Number(incomingOrder.amount)
                      ? new Date().toISOString()
                      : null,
      })
      .eq('id', incomingOrder.id)

    if (incomingUpdateErr) {
      console.error(`Failed to update incoming order ${incomingOrder.id}:`, incomingUpdateErr)
      throw incomingUpdateErr
    }

    // ――― Step 4d: Transfer funds between buyer & seller WITH POST-TRADE FEES ―――
    // Buyer = whichever side had type='buy'
    // Seller = whichever side had type='sell'
    const buyerId  = incomingOrder.type === 'buy'
      ? incomingOrder.user_id
      : counter.user_id
    const sellerId = incomingOrder.type === 'sell'
      ? incomingOrder.user_id
      : counter.user_id

    // Calculate trading fees (0.15% on USDT amount)
    const tradingFeeUSDT = tradeAmt * 0.0015 // 0.15% of USDT traded
    const tradingFeePKR = tradingFeeUSDT * tradePrice // Fee in PKR equivalent

    // ――― NEW: Post-Trade Fee Deduction Logic ―――
    // Fees are deducted from what users receive, not paid upfront

    // 1) Deduct buyer's locked PKR: full amount (no fee involved in deduction)
    await deductLockedBalance(buyerId, 'PKR', tradeAmt * tradePrice)

    // 2) Deduct seller's locked USDT: full amount (no fee involved in deduction)  
    await deductLockedBalance(sellerId, 'USDT', tradeAmt)

    // 3) Credit buyer with USDT MINUS fee: tradeAmt - tradingFeeUSDT
    const buyerReceivesUSDT = tradeAmt - tradingFeeUSDT
    await creditBalance(buyerId, 'USDT', buyerReceivesUSDT)

    // 4) Credit seller with PKR MINUS fee: (tradeAmt - tradingFeeUSDT) * tradePrice
    const sellerReceivesPKR = buyerReceivesUSDT * tradePrice
    await creditBalance(sellerId, 'PKR', sellerReceivesPKR)

    // 5) Collect platform fees (total fee from both parties)
    await collectTradingFee(buyerId, incomingOrder.id, tradingFeeUSDT / 2, 'buy')
    await collectTradingFee(sellerId, counter.id, tradingFeeUSDT / 2, 'sell')

    console.log(`✅ Trade executed: ${tradeAmt} USDT at ₨${tradePrice}`)
    console.log(`   Buyer receives: ${buyerReceivesUSDT.toFixed(6)} USDT (after fee)`)
    console.log(`   Seller receives: ₨${sellerReceivesPKR.toFixed(2)} (after fee)`)
    console.log(`   Platform fee: ${tradingFeeUSDT.toFixed(6)} USDT`)

    // After one partial match (25 out of 50), loop ends because remaining=0.

    // Record the trade
    await recordTrade(
      incomingOrder.id,
      counter.id,
      buyerId,
      sellerId,
      tradeAmt,
      tradePrice,
      tradingFeeUSDT
    )
  }

  // ――― Step 5: Broadcast the fresh order–book snapshot ―――
  try {
    const book = await fetchCurrentOrderBook()
    _emitOrderBook(book)
  } catch (err) {
    console.warn('Failed to emit order–book update:', err)
  }
}

/**
 * Returns the current open (pending) orders, grouped into buy / sell.
 * We show only 'pending' orders, sorted by price/time.
 */
export async function fetchCurrentOrderBook() {
  // 1) All pending buys, highest price first
  const { data: buyOrders, error: buyErr } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'pending')
    .eq('type', 'buy')
    .order('price',      { ascending: false })
    .order('created_at', { ascending: true })

  if (buyErr) {
    console.error('Error fetching buy side of order book:', buyErr)
    return { buy: [], sell: [] }
  }

  // 2) All pending sells, lowest price first
  const { data: sellOrders, error: sellErr } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'pending')
    .eq('type', 'sell')
    .order('price',      { ascending: true })
    .order('created_at', { ascending: true })

  if (sellErr) {
    console.error('Error fetching sell side of order book:', sellErr)
    return { buy: buyOrders ?? [], sell: [] }
  }

  return {
    buy:  buyOrders  ?? [],
    sell: sellOrders ?? [],
  }
}

/**
 * Records a completed trade in the trades table with full details
 */
async function recordTrade(
  buyerOrderId: string,
  sellerOrderId: string,
  buyerUserId: string,
  sellerUserId: string,
  tradeAmount: number,
  tradePrice: number,
  tradingFeeUSDT: number
) {
  try {
    const totalValue = tradeAmount * tradePrice
    const buyerReceivesUSDT = tradeAmount - tradingFeeUSDT
    const sellerReceivesPKR = buyerReceivesUSDT * tradePrice

    // Insert trade record using admin client to bypass RLS
    const { data: trade, error: tradeError } = await supabaseAdmin
      .from('trades')
      .insert({
        buyer_order_id: buyerOrderId,
        seller_order_id: sellerOrderId,
        buyer_user_id: buyerUserId,
        seller_user_id: sellerUserId,
        trade_amount: tradeAmount,
        trade_price: tradePrice,
        total_value: totalValue,
        buyer_fee: tradingFeeUSDT / 2,
        seller_fee: tradingFeeUSDT / 2,
        platform_fee_total: tradingFeeUSDT,
        trade_status: 'completed'
      })
      .select('id')
      .single()

    if (tradeError) {
      console.error('Failed to record trade:', tradeError)
      return null
    }

    // Insert trade details using admin client to bypass RLS
    const { error: detailsError } = await supabaseAdmin
      .from('trade_details')
      .insert({
        trade_id: trade.id,
        buyer_received_usdt: buyerReceivesUSDT,
        seller_received_pkr: sellerReceivesPKR,
        buyer_paid_pkr: totalValue,
        seller_provided_usdt: tradeAmount,
        exchange_rate: tradePrice,
        fee_rate: 0.0015
      })

    if (detailsError) {
      console.error('Failed to record trade details:', detailsError)
    }

    console.log(`📊 Trade recorded: ${trade.id} - ${tradeAmount} USDT at ₨${tradePrice}`)
    return trade.id
  } catch (error) {
    console.error('Error recording trade:', error)
    return null
  }
}
