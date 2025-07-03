'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { ShieldExclamationIcon, IdentificationIcon } from '@heroicons/react/24/outline'

interface RequireKYCProps {
  children: React.ReactNode
  loadingComponent?: React.ReactNode
}

export default function RequireKYC({ children, loadingComponent }: RequireKYCProps) {
  const router = useRouter()
  const session = useSession()
  const supabase = useSupabaseClient()
  const [kycStatus, setKycStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session === undefined) return
    if (session === null) {
      router.replace('/auth/login')
      return
    }

    async function checkKycStatus() {
      try {
        const { data, error } = await supabase
          .from('user_profile')
          .select('kyc_status')
          .eq('uid', session!.user.id)
          .single()

        if (error) {
          console.error('Error fetching KYC status:', error)
          setKycStatus('not_submitted')
        } else {
          setKycStatus(data.kyc_status)
        }
      } catch (err) {
        console.error('KYC check failed:', err)
        setKycStatus('not_submitted')
      } finally {
        setLoading(false)
      }
    }

    checkKycStatus()
  }, [session, supabase, router])

  // Show loading state
  if (loading) {
    return loadingComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!session) return null

  // Show KYC required message if not approved
  if (kycStatus !== 'approved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <ShieldExclamationIcon className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">KYC Verification Required</h1>
            <p className="text-gray-600">
              {kycStatus === 'pending' 
                ? 'Your KYC is under review. Please wait for approval.'
                : kycStatus === 'rejected'
                ? 'Your KYC was rejected. Please resubmit your documents.'
                : 'You need to complete KYC verification to access this feature.'
              }
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-orange-800 mb-2">What is KYC?</h3>
            <p className="text-sm text-orange-700">
              Know Your Customer (KYC) verification helps us ensure platform security and compliance with regulations.
            </p>
          </div>

          <div className="space-y-3">
            {kycStatus !== 'pending' && (
              <button
                onClick={() => router.push('/user/kyc')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <IdentificationIcon className="h-5 w-5" />
                {kycStatus === 'rejected' ? 'Resubmit KYC' : 'Verify Now'}
              </button>
            )}
            
            <button
              onClick={() => router.push('/user/dashboard')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

          {kycStatus === 'pending' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Status:</strong> Under Review<br />
                We'll notify you once your verification is complete.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // If KYC is approved, render the protected content
  return <>{children}</>
}

export function useKYCStatus() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const [kycStatus, setKycStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) return

    async function checkKycStatus() {
      try {
        const { data, error } = await supabase
          .from('user_profile')
          .select('kyc_status')
          .eq('uid', session!.user.id)
          .single()

        if (error) {
          console.error('Error fetching KYC status:', error)
          setKycStatus('not_submitted')
        } else {
          setKycStatus(data.kyc_status)
        }
      } catch (err) {
        console.error('KYC check failed:', err)
        setKycStatus('not_submitted')
      } finally {
        setLoading(false)
      }
    }

    checkKycStatus()
  }, [session, supabase])

  return { kycStatus, loading, isApproved: kycStatus === 'approved' }
}
