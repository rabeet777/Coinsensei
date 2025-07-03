export const runtime = 'nodejs'

import { NextRequest, NextResponse }     from 'next/server'
import { cookies }                       from 'next/headers'
import { createRouteHandlerClient }      from '@supabase/auth-helpers-nextjs'
import { createClient as createAdmin }   from '@supabase/supabase-js'
import { createRequire }                 from 'module'
import { randomUUID }                    from 'crypto'
import { addWithdrawalJobSimple } from '@/lib/simpleQueue'

// Helper function to generate unique numeric internal transaction ID
function generateInternalTxId() {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${timestamp}${random}`
}

// ✅ SECURITY: TRON address validation
function isValidTronAddress(address: string): boolean {
  // TRON addresses start with 'T' and are 34 characters long
  const tronRegex = /^T[A-Za-z0-9]{33}$/
  return tronRegex.test(address)
}

// ✅ SECURITY: Rate limiting check
async function checkRateLimit(userId: string, supabaseAdmin: any): Promise<{ allowed: boolean, count: number }> {
  const oneHour = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  
  const { data: recentWithdrawals, error } = await supabaseAdmin
    .from('withdrawals')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', oneHour)
  
  if (error) {
    console.error('Rate limit check error:', error)
    return { allowed: false, count: 0 }
  }
  
  const count = recentWithdrawals?.length || 0
  const maxPerHour = 10 // Maximum 10 withdrawals per hour
  
  return { allowed: count < maxPerHour, count }
}

// ✅ SECURITY: Daily withdrawal limit check
async function checkDailyLimit(userId: string, amount: number, supabaseAdmin: any): Promise<{ allowed: boolean, todayTotal: number }> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStart = today.toISOString()
  
  const { data: todayWithdrawals, error } = await supabaseAdmin
    .from('withdrawals')
    .select('amount')
    .eq('user_id', userId)
    .gte('created_at', todayStart)
    .neq('status', 'cancelled')
  
  if (error) {
    console.error('Daily limit check error:', error)
    return { allowed: false, todayTotal: 0 }
  }
  
  const todayTotal = todayWithdrawals?.reduce((sum: number, w: any) => sum + Number(w.amount), 0) || 0
  const maxDaily = 50000 // $50,000 daily limit
  
  return { allowed: (todayTotal + amount) <= maxDaily, todayTotal }
}

// ✅ SECURITY: Audit logging
async function logSecurityEvent(
  userId: string, 
  action: string, 
  metadata: any, 
  req: NextRequest,
  supabaseAdmin: any
) {
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  
  await supabaseAdmin
    .from('security_audit_logs')
    .insert([{
      user_id: userId,
      action,
      metadata: JSON.stringify(metadata),
      ip_address: clientIP,
      user_agent: userAgent,
      timestamp: new Date().toISOString()
    }])
}

// ✅ SECURITY: Check for suspicious activity
function detectSuspiciousActivity(
  amount: number, 
  toAddress: string, 
  userBalance: number,
  todayTotal: number
): { suspicious: boolean, reasons: string[] } {
  const reasons: string[] = []
  
  // Large withdrawal (>80% of balance)
  if (amount > userBalance * 0.8) {
    reasons.push('Large withdrawal relative to balance')
  }
  
  // Very large single amount
  if (amount > 10000) {
    reasons.push('Large single withdrawal amount')
  }
  
  // Unusual daily activity
  if (todayTotal > 20000) {
    reasons.push('High daily withdrawal volume')
  }
  
  return { suspicious: reasons.length > 0, reasons }
}

// — TronWeb CommonJS import —
const requireCJS = createRequire(import.meta.url)
const TronWebMod = requireCJS('tronweb') as any
const TronWeb    = (TronWebMod.default || TronWebMod) as {
  new(opts: { fullHost:string; headers:Record<string,string> }): any
}

// — ENV VAR ASSERTIONS —
const NEXT_PUBLIC_SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY     = process.env.SUPABASE_SERVICE_ROLE_KEY!
const TRON_FULL_HOST                = process.env.TRON_FULL_HOST!
const TRON_API_KEY                  = process.env.TRON_API_KEY!
const TRON_TRC20_CONTRACT           = process.env.TRON_TRC20_CONTRACT!
const ADMIN_DERIVATION_INDEX        = process.env.ADMIN_DERIVATION_INDEX!

if (
  !NEXT_PUBLIC_SUPABASE_URL ||
  !SUPABASE_SERVICE_ROLE_KEY ||
  !TRON_FULL_HOST ||
  !TRON_API_KEY ||
  !TRON_TRC20_CONTRACT ||
  !ADMIN_DERIVATION_INDEX
) {
  console.error('🚨 Missing required ENV vars')
  throw new Error('Missing required ENV vars')
}

// Supabase admin client
const supabaseAdmin = createAdmin(
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req: NextRequest) {
  let userId: string = ''
  
  try {
    // ✅ SECURITY: Enhanced authentication (Fixed for Next.js 15)
    const supa = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authErr } = await supa.auth.getUser()
    
    if (authErr || !user) {
      console.warn('Unauthorized withdrawal attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    userId = user.id

    // ✅ SECURITY: Enhanced input validation
    const { toAddress, amount, totpCode } = (await req.json()) as {
      toAddress?: string
      amount?: number
      totpCode?: string
    }

    // Basic validation
    if (!toAddress || !amount || amount <= 0) {
      await logSecurityEvent(userId, 'WITHDRAWAL_INVALID_INPUT', { toAddress, amount }, req, supabaseAdmin)
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // ✅ SECURITY: TRON address validation
    if (!isValidTronAddress(toAddress)) {
      await logSecurityEvent(userId, 'WITHDRAWAL_INVALID_ADDRESS', { toAddress }, req, supabaseAdmin)
      return NextResponse.json({ error: 'Invalid TRON address format' }, { status: 400 })
    }

    // ✅ SECURITY: Amount validation (prevent tiny/huge amounts)
    if (amount < 1 || amount > 100000) {
      await logSecurityEvent(userId, 'WITHDRAWAL_INVALID_AMOUNT', { amount }, req, supabaseAdmin)
      return NextResponse.json({ error: 'Amount must be between 1 and 100,000 USDT' }, { status: 400 })
    }

    // ✅ SECURITY: Rate limiting
    const rateLimit = await checkRateLimit(userId, supabaseAdmin)
    if (!rateLimit.allowed) {
      await logSecurityEvent(userId, 'WITHDRAWAL_RATE_LIMITED', { count: rateLimit.count }, req, supabaseAdmin)
      return NextResponse.json({ 
        error: `Rate limit exceeded. Maximum 10 withdrawals per hour. Current: ${rateLimit.count}` 
      }, { status: 429 })
    }

    // ✅ SECURITY: Daily withdrawal limits
    const dailyLimit = await checkDailyLimit(userId, amount, supabaseAdmin)
    if (!dailyLimit.allowed) {
      await logSecurityEvent(userId, 'WITHDRAWAL_DAILY_LIMIT', { 
        amount, 
        todayTotal: dailyLimit.todayTotal 
      }, req, supabaseAdmin)
      return NextResponse.json({ 
        error: `Daily withdrawal limit exceeded. Today: $${dailyLimit.todayTotal}, Limit: $50,000` 
      }, { status: 400 })
    }

    // Load sender's wallet
    const { data: sender, error: seErr } = await supabaseAdmin
      .from('user_wallets')
      .select('balance, derivation_path, address')
      .eq('user_id', userId)
      .maybeSingle()

    if (seErr) {
      console.error('DB error loading sender:', seErr)
      await logSecurityEvent(userId, 'WITHDRAWAL_DB_ERROR', { error: seErr.message }, req, supabaseAdmin)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    
    if (!sender) {
      await logSecurityEvent(userId, 'WITHDRAWAL_NO_WALLET', {}, req, supabaseAdmin)
      return NextResponse.json(
        { error: 'No custodial wallet found; please generate one.' },
        { status: 400 }
      )
    }

    const oldBalance = Number(sender.balance)

    // Check if recipient is internal
    const { data: recipient, error: reErr } = await supabaseAdmin
      .from('user_wallets')
      .select('user_id, balance')
      .eq('address', toAddress)
      .maybeSingle()

    if (reErr) {
      console.error('DB error checking recipient:', reErr)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const isInternalTransfer = !!recipient
    const fee = isInternalTransfer ? 0 : 1
    const totalCost = amount + fee

    // ✅ SECURITY: Balance validation
    if (oldBalance < totalCost) {
      await logSecurityEvent(userId, 'WITHDRAWAL_INSUFFICIENT_BALANCE', {
        balance: oldBalance,
        requested: totalCost
      }, req, supabaseAdmin)
      return NextResponse.json(
        { error: `Insufficient balance: need ${totalCost} USDT, have ${oldBalance} USDT` },
        { status: 400 }
      )
    }

    // ✅ SECURITY: Suspicious activity detection
    const suspiciousCheck = detectSuspiciousActivity(amount, toAddress, oldBalance, dailyLimit.todayTotal)
    if (suspiciousCheck.suspicious) {
      await logSecurityEvent(userId, 'WITHDRAWAL_SUSPICIOUS', {
        amount,
        toAddress,
        reasons: suspiciousCheck.reasons
      }, req, supabaseAdmin)
      
      // For now, just log. In production, you might want to require additional verification
      console.warn(`🚨 Suspicious withdrawal detected for user ${userId}:`, suspiciousCheck.reasons)
    }

    // ✅ SECURITY: TOTP verification for large amounts
    if (amount > 1000 && !totpCode) {
      await logSecurityEvent(userId, 'WITHDRAWAL_TOTP_REQUIRED', { amount }, req, supabaseAdmin)
      return NextResponse.json({ 
        error: 'TOTP verification required for withdrawals over $1,000',
        requiresTOTP: true
      }, { status: 400 })
    }

    // If TOTP provided, verify it (you'll need to implement TOTP verification)
    if (totpCode) {
      // TODO: Implement TOTP verification
      // const totpValid = await verifyTOTP(userId, totpCode)
      // if (!totpValid) {
      //   await logSecurityEvent(userId, 'WITHDRAWAL_TOTP_INVALID', { totpCode: '***' }, req, supabaseAdmin)
      //   return NextResponse.json({ error: 'Invalid TOTP code' }, { status: 400 })
      // }
    }

    const newBalance = oldBalance - totalCost
    const clientProvidedId = randomUUID()

    // ✅ SECURITY: Proper database transaction
    const { data, error: txError } = await supabaseAdmin.rpc('handle_withdrawal_transaction', {
      p_user_id: userId,
      p_to_address: toAddress,
      p_amount: amount,
      p_fee: fee,
      p_new_sender_balance: newBalance,
      p_client_provided_id: clientProvidedId,
      p_is_internal: isInternalTransfer,
      p_recipient_user_id: recipient?.user_id || null
    })

    if (txError) {
      console.error('Transaction error:', txError)
      await logSecurityEvent(userId, 'WITHDRAWAL_TRANSACTION_FAILED', { error: txError.message }, req, supabaseAdmin)
      return NextResponse.json({ error: 'Transaction failed' }, { status: 500 })
    }

    // ✅ SECURITY: Successful withdrawal logging
    await logSecurityEvent(userId, 'WITHDRAWAL_SUCCESS', {
      amount,
      toAddress,
      isInternal: isInternalTransfer,
      clientProvidedId
    }, req, supabaseAdmin)

    // Enqueue external withdrawal job
    if (!isInternalTransfer) {
      console.log('🚀 enqueueing withdrawal job…')
      const jobData = {
        withdrawalId: data.withdrawal_id,
        user_id: userId,
        to_address: toAddress,
        amount,
        fee
      }
      
      try {
        const jobId = await addWithdrawalJobSimple(jobData)
        console.log('✅ Withdrawal job enqueued! Job ID:', jobId)
        
        await logSecurityEvent(userId, 'WITHDRAWAL_JOB_QUEUED', { jobId }, req, supabaseAdmin)
      } catch (err) {
        console.error('❌ Error adding withdrawal job:', err)
        
        // ✅ FALLBACK: Mark withdrawal for manual processing if job queue fails
        try {
          await supabaseAdmin
            .from('withdrawals')
            .update({ 
              status: 'queue_failed',
              metadata: JSON.stringify({ 
                error: 'Job queue failed, requires manual processing',
                original_error: err instanceof Error ? err.message : 'Unknown error'
              })
            })
            .eq('id', data.withdrawal_id)
          
          await logSecurityEvent(userId, 'WITHDRAWAL_JOB_FAILED_FALLBACK', { 
            withdrawalId: data.withdrawal_id,
            error: err instanceof Error ? err.message : 'Unknown error'
          }, req, supabaseAdmin)
          
          console.log('⚠️ Withdrawal marked for manual processing due to queue failure')
        } catch (fallbackErr) {
          console.error('❌ Failed to update withdrawal status:', fallbackErr)
        }
      }
    }

    return NextResponse.json({
      message: isInternalTransfer ? 'Internal transfer completed' : 'Withdrawal queued for processing',
      clientProvidedId,
      newBalance,
      isInternalTransfer,
      estimatedProcessingTime: isInternalTransfer ? '0 minutes' : '5-15 minutes'
    })

  } catch (error) {
    console.error('Withdrawal API error:', error)
    
    if (userId) {
      await logSecurityEvent(userId, 'WITHDRAWAL_SYSTEM_ERROR', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, req, supabaseAdmin)
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 