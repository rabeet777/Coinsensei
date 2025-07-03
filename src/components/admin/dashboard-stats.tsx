// src/app/admin/dashboard-stats.tsx

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DashboardStats() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [pendingKYC, setPendingKYC] = useState(0);
  const [totalPKR, setTotalPKR] = useState(0);
  const [totalUSDT, setTotalUSDT] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: kycCount } = await supabase.from('kyc_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { data: pkrDeposits } = await supabase.from('pkr_deposits').select('amount').eq('status', 'approved');
      const { data: usdtDeposits } = await supabase.from('usdt_deposits').select('amount').eq('status', 'confirmed');

      const pkrTotal = pkrDeposits?.reduce((sum, d) => sum + parseFloat(d.amount), 0) || 0;
      const usdtTotal = usdtDeposits?.reduce((sum, d) => sum + parseFloat(d.amount), 0) || 0;

      setTotalUsers(userCount || 0);
      setPendingKYC(kycCount || 0);
      setTotalPKR(pkrTotal);
      setTotalUSDT(usdtTotal);
    };

    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card title="Total Users" value={totalUsers.toLocaleString()} />
      <Card title="PKR in System" value={`₨ ${totalPKR.toLocaleString()}`} />
      <Card title="USDT in System" value={`$ ${totalUSDT.toLocaleString()}`} />
      <Card title="Pending KYC" value={pendingKYC.toLocaleString()} />
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-md font-semibold text-gray-600 mb-2">{title}</h2>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
