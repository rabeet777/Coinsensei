// lib/adminDashboard.ts
import { supabaseAdmin } from './supabaseAdmin'
import { Database }       from './database.types'

type Metrics = {
  users: { total: number; active: number; new: number }
  volume: { PKR: number; USDT: number }
  kyc: { pending: number; approved: number; rejected: number }
}

export async function getMetrics(): Promise<Metrics> {
  const now = new Date()

  const { count: totalCount } = await supabaseAdmin
    .from('user_profile')
    .select('*', { count: 'exact', head: true })
  const total = totalCount ?? 0

  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { count: activeCount } = await supabaseAdmin
    .from('user_profile')
    .select('*', { count: 'exact', head: true })
    .gt('last_login', thirtyDaysAgo.toISOString())
  const active = activeCount ?? 0

  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { count: newCount } = await supabaseAdmin
    .from('user_profile')
    .select('*', { count: 'exact', head: true })
    .gt('created_at', sevenDaysAgo.toISOString())
  const newUsers = newCount ?? 0

  const { data: pkrRows } = await supabaseAdmin
    .from('deposits')
    .select('amount')
    .eq('status', 'approved')
    .eq('currency', 'PKR')
  const PKR = pkrRows?.reduce((sum, r) => sum + Number(r.amount), 0) ?? 0

  const { data: usdtRows } = await supabaseAdmin
    .from('deposits')
    .select('amount')
    .eq('status', 'approved')
    .eq('currency', 'USDT')
  const USDT = usdtRows?.reduce((sum, r) => sum + Number(r.amount), 0) ?? 0

  const { data: kycData } = await supabaseAdmin
    .from('user_profile')
    .select('kyc_status')
  const kycList = kycData ?? []
  const kycCounts = kycList.reduce(
    (acc, row) => {
      switch (row.kyc_status) {
        case 'pending':  acc.pending++;  break
        case 'approved': acc.approved++; break
        case 'rejected': acc.rejected++; break
      }
      return acc
    },
    { pending: 0, approved: 0, rejected: 0 }
  )

  return {
    users: { total, active, new: newUsers },
    volume: { PKR, USDT },
    kyc: kycCounts
  }
}

export async function getChartsData() {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const from = sevenDaysAgo.toISOString()

  const { data: dep } = await supabaseAdmin.rpc('daily_deposit_volume', { start_date: from })
  const { data: wdr } = await supabaseAdmin.rpc('daily_withdrawal_volume', { start_date: from })

  const timeSeries: { date: string; deposits: number; withdrawals: number }[] = []
  dep?.forEach((d: any) => {
    timeSeries.push({ date: d.date, deposits: d.total, withdrawals: 0 })
  })
  wdr?.forEach((w: any) => {
    const e = timeSeries.find(t => t.date === w.date)
    if (e) e.withdrawals = w.total
  })

  const { data: kycData } = await supabaseAdmin
    .from('user_profile')
    .select('kyc_status')
  const kycList2 = kycData ?? []
  const kycBreakdown = ['pending', 'approved', 'rejected'].map(status => ({
    status,
    count: kycList2.filter(r => r.kyc_status === status).length
  }))

  return { timeSeries, kycBreakdown }
}

export async function getActivityFeed(limit = 10) {
  const { data } = await supabaseAdmin
    .from('audit_logs')
    .select('timestamp, action, target_type, target_id')
    .order('timestamp', { ascending: false })
    .limit(limit)

  return (data ?? []).map(row => ({
    timestamp: new Date(row.timestamp).toLocaleString(),
    message: `${row.action} on ${row.target_type} ${row.target_id}`
  }))
}
