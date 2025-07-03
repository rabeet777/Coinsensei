// Shared OTP store for email verification
// In production, this should be replaced with Redis

export interface OTPData {
  code: string
  expires: number
  action: string
}

// Global OTP store
const otpStore = new Map<string, OTPData>()

export default otpStore

// Helper functions
export const setOTP = (key: string, data: OTPData) => {
  otpStore.set(key, data)
}

export const getOTP = (key: string): OTPData | undefined => {
  return otpStore.get(key)
}

export const deleteOTP = (key: string): boolean => {
  return otpStore.delete(key)
}

export const cleanupExpiredOTPs = () => {
  const now = Date.now()
  for (const [key, value] of otpStore.entries()) {
    if (now > value.expires) {
      otpStore.delete(key)
    }
  }
}

// Generate 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
} 