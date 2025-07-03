import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    // Handle cookies properly for Next.js 15+ compatibility
    const cookiesStore = cookies
    const supabase = createRouteHandlerClient({ cookies: cookiesStore })
    
    // Get the current user (admin)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminProfile } = await supabase
      .from('user_profile')
      .select('role')
      .eq('uid', user.id)
      .single()

    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { requestId, action, adminNotes } = body

    // Validate required fields
    if (!requestId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid request. requestId and action (approve/reject) are required' 
      }, { status: 400 })
    }

    // Get the recovery request
    const { data: recoveryRequest, error: requestError } = await supabase
      .from('user_recovery_requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single()

    if (requestError || !recoveryRequest) {
      return NextResponse.json({ error: 'Recovery request not found or already processed' }, { status: 404 })
    }

    // Update recovery request status
    const { error: updateError } = await supabase
      .from('user_recovery_requests')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        admin_notes: adminNotes,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error updating recovery request:', updateError)
      return NextResponse.json({ error: 'Failed to update recovery request' }, { status: 500 })
    }

    // If approved, reset all security methods for the user
    if (action === 'approve') {
      // Use admin client to bypass RLS and upsert to ensure the record exists
      const { error: securityResetError, data: securityData } = await supabaseAdmin
        .from('user_security')
        .upsert({
          user_id: recoveryRequest.user_id,
          totp_enabled: false,
          sms_enabled: false,
          email_enabled: false,
          totp_secret: null,
          totp_secret_encrypted: null,
          totp_factor_sid: null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (securityResetError) {
        console.error('Error resetting security methods:', securityResetError)
        return NextResponse.json({ error: 'Failed to reset security methods' }, { status: 500 })
      }

      console.log(`Security methods reset for user: ${recoveryRequest.user_id}`, securityData)

      // Verify the security reset worked
      const { data: verifyReset, error: verifyError } = await supabaseAdmin
        .from('user_security')
        .select('*')
        .eq('user_id', recoveryRequest.user_id)
        .single()

      if (verifyError) {
        console.error('Error verifying security reset:', verifyError)
      } else {
        console.log('Security reset verification:', verifyReset)
      }

      console.log(`Recovery request ${requestId} approved successfully for user ${recoveryRequest.user_id}`)
    }

    // Send notification email to user about the decision
    // await sendUserNotification(recoveryRequest.user_id, action, adminNotes)

    return NextResponse.json({ 
      success: true,
      message: `Recovery request ${action}d successfully${action === 'approve' ? '. User security methods have been reset.' : '.'}`,
      data: {
        requestId,
        action,
        userId: recoveryRequest.user_id,
        approvedBy: user.id,
        approvedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Recovery request approval error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 