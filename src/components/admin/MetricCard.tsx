// components/admin/MetricCard.tsx
'use client'
import React from 'react'

interface MetricCardProps {
  title: string
  value: number | string
  subtitle?: string
}

export default function MetricCard({ title, value, subtitle }: MetricCardProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6 flex flex-col">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
    </div>
  )
}
