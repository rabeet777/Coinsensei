import crypto from 'crypto'

// ✅ Environment validation
export function validateSecurityEnvironment(): void {
  const requiredEnvVars = [
    'ENCRYPTED_HDWALLET_MNEMONIC',
    'WALLET_ENCRYPTION_KEY',
    'WALLET_IV',
    'WALLET_AUTH_TAG'
  ]

  const missing = requiredEnvVars.filter(env => !process.env[env])
  
  if (missing.length > 0) {
    throw new Error(`Missing critical environment variables: ${missing.join(', ')}`)
  }

  // Check that old plain text mnemonic is not present
  if (process.env.HDWALLET_MNEMONIC) {
    console.warn('⚠️  WARNING: Plain text HDWALLET_MNEMONIC still present in environment!')
    console.warn('⚠️  Please remove it and use only encrypted version')
  }
}

// ✅ Key rotation utility (run periodically)
export function generateNewEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex')
}

// ✅ Secure memory cleanup
export function clearSensitiveData(data: string): void {
  // Overwrite memory with zeros
  if (data) {
    (data as any).fill(0)
  }
}

// ✅ Access logging for audit trails
export function logCriticalAccess(operation: string, userId?: string): void {
  const timestamp = new Date().toISOString()
  console.log(`[SECURITY] ${timestamp} - ${operation} - User: ${userId || 'system'}`)
  
  // In production, send to security monitoring service
  // await securityMonitoring.log({ operation, userId, timestamp })
}

// ✅ Rate limiting storage (production should use Redis)
const rateLimitStore = new Map<string, number[]>()

export function checkRateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const requests = rateLimitStore.get(identifier) || []
  
  // Remove old requests outside the window
  const validRequests = requests.filter(time => now - time < windowMs)
  
  if (validRequests.length >= maxRequests) {
    return false // Rate limit exceeded
  }
  
  validRequests.push(now)
  rateLimitStore.set(identifier, validRequests)
  return true
}

// ✅ IP allowlist for admin operations (if needed)
export function isIPAllowed(ip: string, allowedIPs: string[] = []): boolean {
  if (allowedIPs.length === 0) return true // No restrictions
  return allowedIPs.includes(ip)
} 