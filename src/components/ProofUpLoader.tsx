// components/ProofUpLoader.tsx
'use client'

import React, { useState } from 'react'

export interface ProofUpLoaderProps {
  /** The deposit request ID to attach proof to */
  id: string
  /** Called when upload & processing finishes successfully */
  onDone(): void
}

export default function ProofUpLoader({
  id,
  onDone
}: ProofUpLoaderProps) {
  const [file, setFile]       = useState<File | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const upload = async () => {
    if (!file) return
    setError(null)
    setLoading(true)

    const formData = new FormData()
    formData.append('screenshot', file)

    try {
      const res = await fetch(`/api/user/deposits/${id}/proof`, {
        method: 'POST',
        body: formData
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || res.statusText)

      onDone()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="image/*"
        onChange={e => setFile(e.target.files?.[0] ?? null)}
        className="block"
      />
      <button
        onClick={upload}
        disabled={!file || loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Uploading…' : 'Upload Proof'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  )
}
