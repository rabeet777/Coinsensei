'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { toast } from 'sonner'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface AdminGuardProps {
  children: ReactNode
  redirectTo?: string
  fallbackPath?: string
}

export default function AdminGuard({ 
  children, 
  redirectTo,
  fallbackPath = '/user/dashboard' 
}: AdminGuardProps) {
  const router = useRouter()
  const session = useSession()
  const supabase = useSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (session === null) {
      const currentPath = window.location.pathname
      router.replace(`/auth/login?redirectTo=${encodeURIComponent(redirectTo || currentPath)}`)
      return
    }

    if (session === undefined) return // Still loading

    const checkAdminStatus = async () => {
      try {
        const { data: profile, error } = await supabase
          .from('user_profile')
          .select('role')
          .eq('uid', session.user.id)
          .single()

        if (error) {
          console.error('Error checking admin status:', error)
          toast.error('Failed to verify admin access')
          router.push(fallbackPath)
          return
        }

        if (profile?.role !== 'admin') {
          toast.error('Access denied. Admin privileges required.')
          router.push(fallbackPath)
          return
        }

        setIsAdmin(true)
      } catch (err) {
        console.error('Error in admin check:', err)
        toast.error('Failed to verify admin access')
        router.push(fallbackPath)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [session, supabase, router, redirectTo, fallbackPath])

  // Loading state
  if (session === undefined || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access admin settings.</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Admin privileges are required to access this page.</p>
          <button
            onClick={() => router.push(fallbackPath)}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 