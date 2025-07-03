'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WithdrawlsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to PKR withdrawls page since that's where the actual content is
    router.replace('/admin/withdrawls/pkr');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Redirecting to PKR Withdrawals...
        </h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
}
