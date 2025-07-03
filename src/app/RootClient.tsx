'use client'

import React, { useState }                  from 'react'
import { SessionContextProvider }           from '@supabase/auth-helpers-react'
import { createPagesBrowserClient }         from '@supabase/auth-helpers-nextjs'
import type { Database }                    from '@/lib/database.types'

export default function RootClient({ children }: { children: React.ReactNode }) {
  const [supabaseClient] = useState(() =>
    createPagesBrowserClient<Database>()
  )

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      {children}
    </SessionContextProvider>
  )
}
