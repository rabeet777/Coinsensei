// src/services/walletService.ts

import { supabase } from '@/lib/supabase'

/**
 * Strongly‐typed shape for a wallet row in either user_pkr_wallets or user_wallets.
 */
export interface WalletRow {
  user_id:        string
  balance:        number
  locked_balance: number
}

// Trading fee configuration
export const TRADING_FEE_RATE = 0.0015 // 0.15%

/**
 * Calculate trading fee for a given USDT amount
 */
export function calculateTradingFee(usdtAmount: number): number {
  return usdtAmount * TRADING_FEE_RATE
}

/**
 * Ensures that a user has a wallet row in the given currency table.
 * If no row exists, inserts one with balance=0 and locked_balance=0.
 * Always returns a WalletRow.
 */
export async function ensureWallet(
  userId: string,
  currency: 'PKR' | 'USDT'
): Promise<WalletRow> {
  // Choose the correct table name based on currency
  const tableName = currency === 'PKR' ? 'user_pkr_wallets' : 'user_wallets'

  // 1) Try to select an existing wallet row
  const { data, error } = await supabase
    .from(tableName)
    .select('user_id, balance, locked_balance')
    .eq('user_id', userId)
    .single()

  // 2) If no row exists, insert a new one and return it
  if (error) {
    // Supabase 2.x returns code "PGRST116" when .single() finds no rows
    const notFoundCodes = ['PGRST116']
    if (notFoundCodes.includes(error.code) || error.details?.includes('Results contain 0 rows')) {
      const { data: inserted, error: insertErr } = await supabase
        .from(tableName)
        .insert({
          user_id:        userId,
          balance:        0,
          locked_balance: 0,
        })
        .select('user_id, balance, locked_balance')
        .single()

      if (insertErr || !inserted) {
        console.error(`Failed to insert wallet into ${tableName}:`, insertErr)
        throw insertErr || new Error(`Could not create wallet row for user ${userId}`)
      }
      return inserted
    }

    // If it was some other error, rethrow
    console.error(`Error querying ${tableName} for user ${userId}:`, error)
    throw error
  }

  // 3) If we fetched data successfully, return it
  if (!data) {
    // This should not happen, but guard against data being null
    throw new Error(`Unexpectedly no wallet row for user ${userId} in ${tableName}`)
  }
  return data
}

/**
 * Locks `amount` of `currency` by moving it from `balance` → `locked_balance`.
 * Throws if available balance < amount.
 */
export async function lockBalance(
  userId: string,
  currency: 'PKR' | 'USDT',
  amount: number
): Promise<void> {
  const tableName = currency === 'PKR' ? 'user_pkr_wallets' : 'user_wallets'
  const wallet = await ensureWallet(userId, currency)

  if (wallet.balance < amount) {
    throw new Error('Insufficient available balance')
  }

  const { error } = await supabase
    .from(tableName)
    .update({
      balance:        wallet.balance - amount,
      locked_balance: wallet.locked_balance + amount,
    })
    .eq('user_id', userId)

  if (error) {
    console.error(`Error locking ${amount} ${currency} for user ${userId}:`, error)
    throw error
  }
}

/**
 * Permanently deducts `amount` of `currency` from the user's locked_balance.
 * Use this when that locked amount is actually spent in a trade.
 * Throws if locked_balance < amount.
 */
export async function deductLockedBalance(
  userId: string,
  currency: 'PKR' | 'USDT',
  amount: number
): Promise<void> {
  const tableName = currency === 'PKR' ? 'user_pkr_wallets' : 'user_wallets'
  const wallet = await ensureWallet(userId, currency)

  if (wallet.locked_balance < amount) {
    throw new Error('Insufficient locked balance')
  }

  const { error } = await supabase
    .from(tableName)
    .update({
      locked_balance: wallet.locked_balance - amount,
    })
    .eq('user_id', userId)

  if (error) {
    console.error(`Error deducting locked ${amount} ${currency} for user ${userId}:`, error)
    throw error
  }
}

/**
 * Credits `amount` of `currency` to the user's available balance (no change to locked_balance).
 * Use this when you want to give the user new funds (e.g., from the counterparty in a trade).
 */
export async function creditBalance(
  userId: string,
  currency: 'PKR' | 'USDT',
  amount: number
): Promise<void> {
  const tableName = currency === 'PKR' ? 'user_pkr_wallets' : 'user_wallets'
  const wallet = await ensureWallet(userId, currency)

  const { error } = await supabase
    .from(tableName)
    .update({
      balance: wallet.balance + amount,
    })
    .eq('user_id', userId)

  if (error) {
    console.error(`Error crediting ${amount} ${currency} to user ${userId}:`, error)
    throw error
  }
}

/**
 * Collects trading fee and adds it to platform wallet
 */
export async function collectTradingFee(
  userId: string,
  orderId: string,
  feeAmount: number,
  orderType: 'buy' | 'sell'
): Promise<void> {
  // 1) Record the fee collection
  const { error: feeRecordError } = await supabase
    .from('platform_fees')
    .insert({
      order_id: orderId,
      user_id: userId,
      fee_amount: feeAmount,
      fee_currency: 'USDT',
      order_type: orderType
    })

  if (feeRecordError) {
    console.error('Error recording platform fee:', feeRecordError)
    throw feeRecordError
  }

  // 2) Add to platform wallet
  const { error: walletError } = await supabase.rpc('increment_platform_wallet', {
    currency_param: 'USDT',
    amount_param: feeAmount
  })

  if (walletError) {
    console.error('Error updating platform wallet:', walletError)
    throw walletError
  }
}

/**
 * Unlocks balance when an order is cancelled
 */
export async function unlockBalance(
  userId: string,
  currency: 'PKR' | 'USDT',
  amount: number
): Promise<void> {
  const tableName = currency === 'PKR' ? 'user_pkr_wallets' : 'user_wallets'
  const wallet = await ensureWallet(userId, currency)

  const { error } = await supabase
    .from(tableName)
    .update({
      balance: wallet.balance + amount,
      locked_balance: wallet.locked_balance - amount,
    })
    .eq('user_id', userId)

  if (error) {
    console.error(`Error unlocking ${amount} ${currency} for user ${userId}:`, error)
    throw error
  }
}
