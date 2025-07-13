// components/PasswordChangeModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useSupabaseClient, useSession, Session } from '@supabase/auth-helpers-react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose(): void
  onSuccess(): void
}

export default function PasswordChangeModal({
  open,
  onClose,
  onSuccess,
}: Props) {
  const supabase = useSupabaseClient()
  const session = useSession()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError(null)
      setLoading(false)
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
    }
  }, [open])

  // Check if session exists
  useEffect(() => {
    if (open && !session) {
      onClose()
      toast.error('Please sign in to change your password')
    }
  }, [open, session, onClose])

  const validatePassword = (password: string) => {
    const requirements = [
      { test: /.{8,}/, message: 'At least 8 characters long' },
      { test: /[A-Z]/, message: 'Contains uppercase letter' },
      { test: /[a-z]/, message: 'Contains lowercase letter' },
      { test: /[0-9]/, message: 'Contains number' },
      { test: /[!@#$%^&*(),.?":{}|<>]/, message: 'Contains special character' }
    ]

    const failedRequirements = requirements.filter(req => !req.test.test(password))
    return failedRequirements.length === 0 ? null : failedRequirements.map(r => r.message)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user?.email) {
      setError('Authentication error. Please sign in again.')
      return
    }

    if (!currentPassword) {
      setError('Current password is required.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    const passwordErrors = validatePassword(newPassword)
    if (passwordErrors) {
      setError(`Password requirements not met:\n${passwordErrors.join('\n')}`)
      return
    }
    
    setError(null)
    setLoading(true)
    
    try {
      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: currentPassword
      })

      if (signInError) {
        setError('Current password is incorrect')
        setLoading(false)
        return
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      toast.success('Password updated successfully')
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Password update error:', err)
      setError(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const PasswordInput = ({ 
    label, 
    value, 
    onChange, 
    showPassword, 
    setShowPassword,
    placeholder,
    error: fieldError
  }: { 
    label: string
    value: string
    onChange: (value: string) => void
    showPassword: boolean
    setShowPassword: (show: boolean) => void
    placeholder: string
    error?: string
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          required
          autoComplete="off"
          className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            fieldError ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder={placeholder}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowPassword(!showPassword);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>
      {fieldError && (
        <p className="mt-1 text-sm text-red-600">{fieldError}</p>
      )}
    </div>
  )

  if (!session) return null

  return (
    <Transition show={open} as={React.Fragment}>
      <Dialog 
        as="div" 
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={onClose}
        static
      >
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>

              <Dialog.Title className="text-xl font-semibold text-gray-800 mb-6">
                Change Password
              </Dialog.Title>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-800 text-sm whitespace-pre-line">{error}</p>
                </div>
              )}

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit(e);
                }} 
                className="space-y-4"
              >
                <PasswordInput
                  label="Current Password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  showPassword={showCurrentPassword}
                  setShowPassword={setShowCurrentPassword}
                  placeholder="Enter current password"
                />

                <PasswordInput
                  label="New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                  showPassword={showNewPassword}
                  setShowPassword={setShowNewPassword}
                  placeholder="Enter new password"
                />

                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                  <p className="font-medium mb-2">Password requirements:</p>
                  <ul className="space-y-1">
                    {[
                      { test: /.{8,}/, text: 'At least 8 characters long' },
                      { test: /[A-Z]/, text: 'Must contain uppercase letter' },
                      { test: /[a-z]/, text: 'Must contain lowercase letter' },
                      { test: /[0-9]/, text: 'Must contain at least one number' },
                      { test: /[!@#$%^&*(),.?":{}|<>]/, text: 'Must contain special character' }
                    ].map((req, index) => (
                      <li
                        key={index}
                        className={`flex items-center gap-2 ${
                          req.test.test(newPassword) ? 'text-green-600' : ''
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            req.test.test(newPassword) ? 'bg-green-600' : 'bg-gray-400'
                          }`}
                        />
                        {req.text}
                      </li>
                    ))}
                  </ul>
                </div>

                <PasswordInput
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  showPassword={showConfirmPassword}
                  setShowPassword={setShowConfirmPassword}
                  placeholder="Confirm new password"
                  error={confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : undefined}
                />

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
