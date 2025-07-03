import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Handle cookies properly for Next.js 15+ compatibility  
    const cookiesStore = cookies
    const supabase = createRouteHandlerClient({ cookies: cookiesStore })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profile')
      .select('role')
      .eq('uid', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { walletAddress } = body

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    // This is a placeholder implementation for wallet consolidation
    // In a real implementation, this would trigger actual blockchain consolidation
    console.log(`Starting consolidation for wallet: ${walletAddress}`)

    // Simulate consolidation process
    const consolidationResult = {
      walletAddress,
      status: 'initiated',
      timestamp: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + 300000).toISOString() // 5 minutes
    }

    return NextResponse.json({
      success: true,
      message: 'Consolidation initiated successfully',
      data: consolidationResult
    })

  } catch (error) {
    console.error('Consolidation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate consolidation' },
      { status: 500 }
    )
  }
}
