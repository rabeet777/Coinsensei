'use client'

import { useState } from 'react'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { DevicePhoneMobileIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'

interface PhoneNumberSetupProps {
  currentPhone?: string | null
  onPhoneUpdate?: (phone: string) => void
  onClose?: () => void
}

export default function PhoneNumberSetup({ 
  currentPhone, 
  onPhoneUpdate, 
  onClose 
}: PhoneNumberSetupProps) {
  const session = useSession()
  const supabase = useSupabaseClient()
  const [phone, setPhone] = useState(currentPhone || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, '')
    
    // Handle Pakistan numbers specifically
    if (numbers.startsWith('92')) {
      return numbers.slice(0, 13) // +92 followed by 11 digits max
    } else if (numbers.startsWith('0')) {
      return numbers.slice(0, 11) // 0 followed by 10 digits max
    } else {
      return numbers.slice(0, 10) // 10 digits max for local format
    }
  }

  const validatePhoneNumber = (phoneNum: string) => {
    const numbers = phoneNum.replace(/\D/g, '')
    
    // Pakistan mobile patterns
    const patterns = [
      /^92[0-9]{10}$/,     // +92 format
      /^0[0-9]{10}$/,      // 0 prefix format
      /^[0-9]{10}$/        // Simple 10 digit format
    ]
    
    return patterns.some(pattern => pattern.test(numbers))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user?.id) {
      setError('Not authenticated')
      return
    }

    if (!phone.trim()) {
      setError('Phone number is required')
      return
    }

    const cleanPhone = formatPhoneNumber(phone)
    
    if (!validatePhoneNumber(cleanPhone)) {
      setError('Please enter a valid Pakistani phone number')
      return
    }

    setError('')
    setLoading(true)

    try {
      // Format for storage
      const formattedPhone = cleanPhone.startsWith('92') 
        ? `+${cleanPhone}` 
        : cleanPhone.startsWith('0')
        ? `+92${cleanPhone.slice(1)}`
        : `+92${cleanPhone}`

      // Update in database
      const { error: updateError } = await supabase
        .from('user_profile')
        .update({ phone_number: formattedPhone })
        .eq('uid', session.user.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      toast.success('Phone number updated successfully!')
      onPhoneUpdate?.(formattedPhone)
      onClose?.()
    } catch (err: any) {
      setError(err.message || 'Failed to update phone number')
      toast.error('Failed to update phone number')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
      <div className="text-center mb-6">
        <DevicePhoneMobileIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {currentPhone ? 'Update Phone Number' : 'Add Phone Number'}
        </h2>
        <p className="text-gray-600">
          Enter your Pakistani mobile number for SMS verification
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
              placeholder="03001234567 or +923001234567"
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <span className="text-gray-500 text-sm">🇵🇰</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: +923001234567, 03001234567, or 3001234567
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : currentPhone ? 'Update Number' : 'Add Number'}
          </button>
          
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 text-sm mb-2">📱 Phone Number Requirements:</h3>
        <ul className="text-blue-800 text-xs space-y-1">
          <li>• Must be a valid Pakistani mobile number</li>
          <li>• Required for SMS-based two-factor authentication</li>
          <li>• You'll receive verification codes on this number</li>
          <li>• Keep this number secure and accessible</li>
        </ul>
      </div>
    </div>
  )
} 