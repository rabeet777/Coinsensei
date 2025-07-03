// src/app/admin/layout.tsx

import React from 'react';
import Link from 'next/link';
import { Toaster } from '@/components/ui/toaster';
import { AdminNav } from "@/components/admin/admin-nav"
import { CoinsenseiLogo } from '@/components/ui/coinsensei-logo';
// Suppress Next.js 15+ cookies warnings for Supabase auth helpers
import '@/lib/suppressWarnings';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-lg border-b border-blue-100 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            <Link href="/admin/dashboard" className="flex items-center gap-3">
              <CoinsenseiLogo size="lg" />
              <div>
                <p className="text-xs text-gray-500 -mt-1">Admin Panel</p>
              </div>
            </Link>

            <div className="flex-1 mx-8">
          <AdminNav />
            </div>
          </div>
        </div>
      </header>

      <main className="relative">
        {children}
      </main>
      
      <Toaster />
    </div>
  );
}
