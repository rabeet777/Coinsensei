import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Handle cookies properly for Next.js 15+ compatibility
    const cookiesStore = cookies
    const supabase = createRouteHandlerClient({ cookies: cookiesStore })
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { requestType, reason, livePhoto, userAgent, timestamp } = body

    // Validate required fields
    if (!requestType || !reason || !livePhoto) {
      return NextResponse.json({ 
        error: 'Missing required fields: requestType, reason, and livePhoto are required' 
      }, { status: 400 })
    }

    // Get user profile information for the request
    const { data: userProfile } = await supabase
      .from('user_profile')
      .select('first_name, last_name, email, phone')
      .eq('uid', user.id)
      .single()

    // Create recovery request record
    const { data: recoveryRequest, error: insertError } = await supabase
      .from('user_recovery_requests')
      .insert({
        user_id: user.id,
        request_type: requestType,
        status: 'pending',
        user_message: reason,
        identity_verification: {
          live_photo: livePhoto,
          user_agent: userAgent,
          timestamp: timestamp,
          user_profile: userProfile,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        }
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating recovery request:', insertError)
      return NextResponse.json({ error: 'Failed to create recovery request' }, { status: 500 })
    }

    // Send notification email to admins (you can implement this based on your email system)
    // await sendAdminNotification(recoveryRequest)

    return NextResponse.json({ 
      success: true, 
      requestId: recoveryRequest.id,
      message: 'Recovery request submitted successfully. You will receive an email notification once reviewed.' 
    })

  } catch (error) {
    console.error('Recovery request submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 