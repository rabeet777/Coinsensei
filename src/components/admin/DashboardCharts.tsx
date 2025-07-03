'use client'
import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

interface ChartData { date: string; deposits: number; withdrawals: number }
interface KycData   { status: string; count: number }

interface DashboardChartsProps {
  timeSeries: ChartData[]
  kycBreakdown: KycData[]
}

export function DashboardCharts({ timeSeries, kycBreakdown }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={timeSeries}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="deposits" stroke="#4F46E5" />
          <Line type="monotone" dataKey="withdrawals" stroke="#EC4899" />
        </LineChart>
      </ResponsiveContainer>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={kycBreakdown} dataKey="count" nameKey="status" outerRadius={100} label>
            {kycBreakdown.map((entry, idx) => (
              <Cell key={idx} fill={['#10B981','#F59E0B','#EF4444'][idx % 3]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}