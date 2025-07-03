// src/app/user/account-settings/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { toast } from 'sonner'
import {
  EnvelopeIcon,
  UserIcon,
  KeyIcon,
  ExclamationTriangleIcon,
  CameraIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'

interface UserProfile {
  full_name: string | null
  avatar_url: string | null
}

export default function AccountSettingsPage() {
  const router = useRouter()
  const session = useSession()
  const supabase = useSupabaseClient()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile>({ full_name: null, avatar_url: null })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (session === null) {
      router.replace(
        `/auth/login?redirectTo=${encodeURIComponent('/user/account-settings')}`
      )
    }
  }, [session, router])

  // Load profile data
  useEffect(() => {
    if (!session?.user.id) return

    async function loadProfile() {
      try {
        const { data, error } = await supabase
          .from('user_profile')
          .select('full_name, avatar_url')
          .eq('uid', session!.user.id)
          .single()

        if (error && error.code === 'PGRST116') {
          // No profile row exists → use metadata or blank
          setProfile({
            full_name: session!.user.user_metadata?.full_name || '',
            avatar_url: null
          })
        } else if (error) {
          throw error
        } else {
          setProfile(data)
        }
      } catch (err) {
        console.error('Error loading profile:', err)
        setTimeout(() => {
          toast.error('Failed to load profile')
        }, 0)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [session, supabase])

  // Password validation
  const validatePassword = (pw: string) => {
    if (pw.length < 8) {
      return 'Password must be at least 8 characters'
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pw)) {
      return 'Must contain uppercase, lowercase, and a number'
    }
    return null
  }

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setAvatarUploading(true)
    try {
      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${session!.user.id}-${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadData.path)

      const avatarUrl = urlData.publicUrl

      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profile')
        .update({ avatar_url: avatarUrl })
        .eq('uid', session!.user.id)

      if (updateError) throw updateError

      // Update local state
      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }))
      toast.success('Profile picture updated successfully!')
      
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to upload profile picture')
    } finally {
      setAvatarUploading(false)
    }
  }

  // Handle password change with current-password verification
  const handlePasswordChange = async () => {
    setErrors({})

    const newPwErr = validatePassword(passwordData.newPassword)
    const confirmErr =
      passwordData.newPassword !== passwordData.confirmPassword
        ? 'Passwords do not match'
        : null
    const currentErr = !passwordData.currentPassword
      ? 'Current password is required'
      : null

    if (newPwErr || confirmErr || currentErr) {
      setErrors({
        ...(newPwErr && { newPassword: newPwErr }),
        ...(confirmErr && { confirmPassword: confirmErr }),
        ...(currentErr && { currentPassword: currentErr })
      })
      return
    }

    setPasswordLoading(true)
    try {
      // 1️⃣ Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session?.user.email || '',
        password: passwordData.currentPassword
      })
      if (signInError) {
        setErrors({ currentPassword: 'Current password is incorrect' })
        setPasswordLoading(false)
        return
      }

      // 2️⃣ Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })
      if (updateError) throw updateError

      // 3️⃣ Clear inputs
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      toast.success('Password updated successfully!')
    } catch (err) {
      console.error('Error updating password:', err)
      setErrors({
        currentPassword: 'Failed to update password. Please try again.'
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  if (session === undefined || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }
  if (!session) return null

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Account Settings
        </h1>
        <p className="text-gray-600">
          Manage your personal information and security
        </p>
      </div>

      {/* Profile Picture */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <PhotoIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Profile Picture
            </h2>
            <p className="text-gray-600">
              Upload a profile picture to personalize your account
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          {/* Avatar Display */}
          <div className="relative">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-4 border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center border-4 border-gray-200">
                <UserIcon className="w-10 h-10 text-blue-600" />
              </div>
            )}
            {avatarUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>
          
          {/* Upload Button */}
          <div className="flex-1">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={avatarUploading}
                className="hidden"
              />
              <div className="flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                <CameraIcon className="h-4 w-4 mr-2" />
                {avatarUploading ? 'Uploading...' : 'Upload Photo'}
              </div>
            </label>
            <p className="text-xs text-gray-500 mt-2">
              JPG, PNG up to 5MB
            </p>
          </div>
        </div>
      </div>

      {/* Email (read-only) */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <EnvelopeIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Email Address
            </h2>
            <p className="text-gray-600">
              Your primary email address
            </p>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-gray-800 font-medium">
            {session.user.email}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            To change your email, please contact support or use the security settings
          </p>
        </div>
      </div>

      {/* Full Name (read-only) */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <UserIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Full Name
            </h2>
            <p className="text-gray-600">As registered in your profile</p>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-gray-800 font-medium">
            {profile.full_name || session.user.user_metadata?.full_name || 'Not set'}
          </p>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 bg-orange-100 rounded-lg">
            <KeyIcon className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Change Password
            </h2>
            <p className="text-gray-600">
              Update your password for account security
            </p>
          </div>
        </div>
        <div className="space-y-4">
          {/* Current */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData(prev => ({
                  ...prev,
                  currentPassword: e.target.value
                }))
              }
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                errors.currentPassword ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.currentPassword && (
              <p className="text-red-600 text-sm mt-1">
                {errors.currentPassword}
              </p>
            )}
          </div>
          {/* New */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData(prev => ({
                  ...prev,
                  newPassword: e.target.value
                }))
              }
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                errors.newPassword ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.newPassword && (
              <p className="text-red-600 text-sm mt-1">
                {errors.newPassword}
              </p>
            )}
          </div>
          {/* Confirm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData(prev => ({
                  ...prev,
                  confirmPassword: e.target.value
                }))
              }
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.confirmPassword && (
              <p className="text-red-600 text-sm mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-orange-800 text-sm">
              <strong>Password requirements:</strong><br />
              • At least 8 characters<br />
              • Uppercase & lowercase letters<br />
              • At least one number
            </p>
          </div>

          <button
            onClick={handlePasswordChange}
            disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {passwordLoading ? 'Updating Password...' : 'Change Password'}
          </button>
        </div>
      </div>

      {/* Security Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <ExclamationTriangleIcon className="h-6 w-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">
              Account Security
            </h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Your profile picture is stored securely</li>
              <li>• Your full name is used for verification and KYC</li>
              <li>• Keep your password strong and private</li>
              <li>• We never share your personal data with third parties</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={() => router.push('/user/security')}
          className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
        >
          Manage Security Settings
        </button>
      </div>
    </div>
  )
}
