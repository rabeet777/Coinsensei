'use client'
import React from 'react'

interface Activity { timestamp: string; message: string }
interface ActivityFeedProps { items: Activity[] }

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
      {items.map((item, idx) => (
        <li key={idx} className="py-2">
          <span className="text-xs text-gray-500">{item.timestamp}</span>
          <p className="text-sm text-gray-800">{item.message}</p>
        </li>
      ))}
    </ul>
  );
}