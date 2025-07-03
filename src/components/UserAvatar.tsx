// components/UserAvatar.tsx
'use client'

import React from 'react'

interface UserAvatarProps {
  url: string | null
  name: string
  size?: number
}

export default function UserAvatar({
  url,
  name,
  size = 40,
}: UserAvatarProps) {
  const initials = name
    .split(' ')
    .filter((w) => w)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?'
  const dim = `${size}px`

  if (url) {
    return (
      <img
        src={url}
        alt={`${name}’s avatar`}
        style={{ width: dim, height: dim }}
        className="rounded-full object-cover border-2 border-gray-200"
      />
    )
  }
  return (
    <div
      style={{ width: dim, height: dim }}
      className="rounded-full bg-blue-200 flex items-center justify-center select-none"
    >
      <span className="font-bold text-blue-800">{initials}</span>
    </div>
  )
}
