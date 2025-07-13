// src/app/user/account-settings/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { toast } from 'sonner'
import {
  Settings2,
  Mail,
  User2,
  Camera,
  ImageIcon,
  ShieldAlert,
  ChevronRight,
  BadgeCheck,
  KeyRound
} from 'lucide-react'

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
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [session, supabase])

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setAvatarUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${session!.user.id}-${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadData.path)

      const avatarUrl = urlData.publicUrl

      const { error: updateError } = await supabase
        .from('user_profile')
        .update({ avatar_url: avatarUrl })
        .eq('uid', session!.user.id)

      if (updateError) throw updateError

      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }))
      toast.success('Profile picture updated successfully!')
      
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to upload profile picture')
    } finally {
      setAvatarUploading(false)
    }
  }

  if (session === undefined || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/30">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }
  if (!session) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/30">
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg mb-4">
            <Settings2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Account Settings
          </h1>
          <p className="text-gray-600">
            Manage your personal information and security preferences
          </p>
        </div>

        {/* Profile Picture */}
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg">
              <ImageIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Profile Picture
              </h2>
              <p className="text-gray-600">
                Upload a photo to personalize your account
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="relative">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                  <User2 className="w-12 h-12 text-blue-600" />
                </div>
              )}
              {avatarUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={avatarUploading}
                  className="hidden"
                />
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-medium rounded-lg transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50">
                  <Camera className="h-4 w-4 mr-2" />
                  {avatarUploading ? 'Uploading...' : 'Upload Photo'}
                </div>
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: JPG, PNG (max 5MB)
              </p>
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Email Address
                </h2>
                <p className="text-gray-600">
                  Your verified email address
                </p>
              </div>
            </div>
            <BadgeCheck className="h-5 w-5 text-green-500" />
          </div>
          <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg border border-gray-200/80">
            <p className="text-gray-800 font-medium">
              {session.user.email}
            </p>
          </div>
        </div>

        {/* Full Name */}
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-green-100 to-green-200 rounded-lg">
              <User2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Full Name
              </h2>
              <p className="text-gray-600">As registered in your profile</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-green-50/30 rounded-lg border border-gray-200/80">
            <p className="text-gray-800 font-medium">
              {profile.full_name || session.user.user_metadata?.full_name || 'Not set'}
            </p>
          </div>
        </div>

        {/* Security Note */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <ShieldAlert className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">
                Account Security
              </h3>
              <ul className="text-blue-700 text-sm space-y-2">
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2" />
                  Your profile information is encrypted and stored securely
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2" />
                  Full name is used for verification and KYC purposes
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2" />
                  We never share your personal data with third parties
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/user/security')}
            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 font-medium rounded-lg transition-all duration-300 border border-gray-200 shadow-sm hover:shadow-md group"
          >
            <KeyRound className="h-4 w-4 mr-2 text-gray-600" />
            Security Settings
            <ChevronRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
          </button>
          <button
            onClick={() => router.push('/user/settings/change-password')}
            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium rounded-lg transition-all duration-300 shadow-sm hover:shadow-md group"
          >
            Change Password
            <ChevronRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>
    </div>
  )
}
