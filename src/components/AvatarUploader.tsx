'use client'
import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AvatarUploaderProps {
  initialUrl: string | null
  onUpload(url: string): void
  onClose(): void
}

export default function AvatarUploader({ initialUrl, onUpload, onClose }: AvatarUploaderProps) {
  const [file, setFile]     = useState<File|null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string|null>(null)

  const handleUpload = async () => {
    if (!file) return
    setError(null)
    setLoading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const { data, error: upErr } = await supabase
      .storage
      .from('avatars')
      .upload(fileName, file)
    if (upErr) {
      setError(upErr.message)
      setLoading(false)
      return
    }
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path)
    onUpload(urlData.publicUrl)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="bg-white p-6 rounded w-80 relative z-10 space-y-4">
        <h2 className="text-lg font-semibold">Upload Avatar</h2>
        <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)} />
        {error && <p className="text-red-500">{error}</p>}
        <div className="flex justify-end space-x-2">
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  )
}
