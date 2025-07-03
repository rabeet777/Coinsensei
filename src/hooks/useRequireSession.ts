'use client'
import { useState, useEffect }     from 'react'
import { useRouter }               from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useSession }          from '@supabase/auth-helpers-react'
import type { Session }        from '@supabase/supabase-js'

export function useRequireSession(): Session | null | undefined {
    const session = useSession()
    const router  = useRouter()
  
    useEffect(() => {
      if (session === null) {
        // no session, force to login
        router.replace('/auth/login')
      }
    }, [session, router])
  
    return session
  }