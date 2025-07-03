// no "use client" here
import type { Metadata } from 'next'
import './globals.css'

import SupabaseProvider from '@/components/SupabaseProvider'
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import Providers from '@/components/Providers'
// Suppress Next.js 15+ cookies warnings for Supabase auth helpers (multiple approaches)
import '@/lib/suppressWarnings'
import '@/lib/globalSuppression.js'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: 'Coinsensei',
  description: 'USDT Trading Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <SupabaseProvider>
            {children}
            <Toaster />
          </SupabaseProvider>
        </Providers>
      </body>
    </html>
  )
}
