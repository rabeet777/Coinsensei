'use client'
import React, { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { supabase } from '@/lib/supabase'

export interface UsernameChangeModalProps {
  current: string
  onClose(): void
  onSuccess(newUsername: string): void
}

export default function UsernameChangeModal({
  current,
  onClose,
  onSuccess,
}: UsernameChangeModalProps) {
  const [username, setUsername] = useState(current)
  const [error, setError]       = useState<string|null>(null)
  const [loading, setLoading]   = useState(false)

  const handleSave = async () => {
    setError(null)
    if (!username.match(/^[a-zA-Z0-9_]{3,20}$/)) {
      setError('Use 3–20 letters, numbers or underscores.')
      return
    }
    setLoading(true)

    // ensure no one else has it
    const { data, error: dupErr } = await supabase
      .from('user_profile')
      .select('id')
      .eq('username', username)
      .limit(1)

    if (dupErr) {
      setError('Error checking username.')
      setLoading(false)
      return
    }
    if (data && data.length > 0 && data[0].id !== undefined) {
      setError('That username is already taken.')
      setLoading(false)
      return
    }

    onSuccess(username)
    setLoading(false)
  }

  return (
    <Dialog open={true} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30" />
      <Dialog.Panel className="bg-white p-6 rounded w-80 z-10 space-y-4">
        <Dialog.Title className="text-lg font-semibold">Change Username</Dialog.Title>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2">Cancel</button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Dialog.Panel>
    </Dialog>
  )
}
