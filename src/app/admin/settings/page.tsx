'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { toast } from 'sonner'
import { 
  ShieldCheckIcon, 
  KeyIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import AdminGuard from '../../../components/admin/AdminGuard'

export default function AdminSettingsPage() {
  const router = useRouter()
  const session = useSession()
  const supabase = useSupabaseClient()
  const [securityStatus, setSecurityStatus] = useState({
    totp_enabled: false,
    sms_enabled: false,
    email_enabled: false
  })
  const [loading, setLoading] = useState(true)

  // Load security status
  useEffect(() => {
    if (!session?.user?.id) return

    const loadSecurityStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('user_security')
          .select('totp_enabled, sms_enabled, email_enabled')
          .eq('user_id', session.user.id)
          .single()

        if (!error && data) {
          setSecurityStatus(data)
        }
      } catch (err) {
        console.error('Error loading security status:', err)
      } finally {
        setLoading(false)
      }
    }

    loadSecurityStatus()
  }, [session, supabase])

  return (
    <AdminGuard redirectTo="/admin/settings">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Settings</h1>
          <p className="text-gray-600">Configure system-wide settings and admin security</p>
        </div>

      {/* Admin Security Settings */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Admin Security Setup</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <KeyIcon className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">TOTP Setup</h3>
                </div>
                {securityStatus.totp_enabled && (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                )}
              </div>
              <p className="text-blue-800 text-sm mb-2">Setup authenticator app for your admin account</p>
              <p className="text-xs text-blue-700 mb-4">
                Status: {securityStatus.totp_enabled ? '✅ Enabled' : '❌ Not configured'}
              </p>
              <Link
                href="/admin/settings/Authenticator"
                className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {securityStatus.totp_enabled ? 'Reconfigure TOTP' : 'Setup TOTP'}
              </Link>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <DevicePhoneMobileIcon className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">SMS Setup</h3>
                </div>
                {securityStatus.sms_enabled && (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                )}
              </div>
              <p className="text-green-800 text-sm mb-2">Setup SMS verification for your admin account</p>
              <p className="text-xs text-green-700 mb-4">
                Status: {securityStatus.sms_enabled ? '✅ Enabled' : '❌ Not configured'}
              </p>
              <Link
                href="/admin/settings/sms"
                className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                {securityStatus.sms_enabled ? 'Reconfigure SMS' : 'Setup SMS'}
              </Link>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">Email Setup</h3>
                </div>
                {securityStatus.email_enabled && (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                )}
              </div>
              <p className="text-purple-800 text-sm mb-2">Setup email verification for your admin account</p>
              <p className="text-xs text-purple-700 mb-4">
                Status: {securityStatus.email_enabled ? '✅ Enabled' : '❌ Not configured'}
              </p>
              <Link
                href="/admin/settings/email"
                className="block w-full text-center bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
              >
                {securityStatus.email_enabled ? 'Reconfigure Email' : 'Setup Email'}
              </Link>
            </div>
          </div>
        </div>
      </div>
      </div>
    </AdminGuard>
  )
}
