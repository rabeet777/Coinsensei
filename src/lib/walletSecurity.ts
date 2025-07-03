import { supabaseAdmin } from './supabaseAdmin'

// ✅ Rate limiting for wallet creation
const walletCreationLimits = new Map<string, number>()

export function checkWalletCreationRate(userId: string): boolean {
  const now = Date.now()
  const lastCreation = walletCreationLimits.get(userId) || 0
  
  // ✅ Only allow one wallet creation per user per hour
  if (now - lastCreation < 60 * 60 * 1000) {
    return false
  }
  
  walletCreationLimits.set(userId, now)
  return true
}

// ✅ Log all wallet operations for security monitoring
export async function logWalletOperation(
  userId: string, 
  operation: 'create' | 'access' | 'derive',
  metadata: Record<string, any> = {}
) {
  try {
    await supabaseAdmin.from('wallet_security_logs').insert({
      user_id: userId,
      operation,
      metadata,
      ip_address: metadata.ip,
      user_agent: metadata.userAgent,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to log wallet operation:', error)
  }
}

// ✅ Detect suspicious wallet access patterns
export async function detectSuspiciousActivity(userId: string): Promise<boolean> {
  try {
    // Check for rapid wallet creation attempts
    const { data: recentOps } = await supabaseAdmin
      .from('wallet_security_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Last 10 minutes
    
    // ✅ Flag if more than 5 operations in 10 minutes
    if (recentOps && recentOps.length > 5) {
      return true
    }
    
    return false
  } catch (error) {
    console.error('Error detecting suspicious activity:', error)
    return false
  }
} 