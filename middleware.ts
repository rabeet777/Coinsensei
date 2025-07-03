// middleware.ts
import { NextResponse }               from 'next/server'
import type { NextRequest }           from 'next/server'
import { createMiddlewareClient }     from '@supabase/auth-helpers-nextjs'
import type { Database }              from './src/lib/database.types'

export default async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient<Database>({ req, res })
   
  // 1) Check session
  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = req.nextUrl

  

  // public routes that need no auth
  if (
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/public') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return res
  }

  // 2) If no session, redirect to login
  if (!session) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    return NextResponse.redirect(loginUrl)
  }

  // 3) Fetch the user’s role
  const { data: profile, error: profileErr } = await supabase
    .from('user_profile')
    .select('role')
    .eq('uid', session.user.id)
    .single()

  const role = profile?.role
  if (profileErr) {
    console.error('RLS/profile fetch error:', profileErr)
    // fallback: log them out
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    return NextResponse.redirect(loginUrl)
  }

  // 4) Enforce admin vs user paths
  if (pathname.startsWith('/admin')) {
    if (role !== 'admin') {
      const userDash = req.nextUrl.clone()
      userDash.pathname = '/user/dashboard'
      return NextResponse.redirect(userDash)
    }
  } else if (pathname.startsWith('/user')) {
    if (role !== 'user') {
      const adminDash = req.nextUrl.clone()
      adminDash.pathname = '/admin/dashboard'
      return NextResponse.redirect(adminDash)
    }
  }

  // allow through
  return res
}

export const config = {
  // protect everything under /admin/* and /user/*
  matcher: ['/admin/:path*', '/user/:path*'],
}
