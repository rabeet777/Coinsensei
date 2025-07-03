// pages/api/send-email-otp.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { setOTP, generateOTP, cleanupExpiredOTPs } from '../../src/lib/otpStore'

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' })
  }

  const { email, action = 'login' } = req.body as { 
    email?: string
    action?: string 
  }

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' })
  }

  console.log('Email OTP request:', { email, action })

  // For password reset, verify user exists
  if (action === 'password_reset') {
    try {
      // Check if user exists using Auth Admin listUsers
      const { data: usersList, error: authError } = await supabaseAdmin.auth.admin.listUsers()

      if (authError) {
        console.error('Failed to list users:', authError)
        return res.status(500).json({ error: 'Failed to process request' })
      }

      // Find user by email
      const foundUser = usersList?.users?.find(user => user.email === email)

      console.log('Auth user lookup:', { found: !!foundUser })

      if (!foundUser) {
        // Don't reveal if user exists for security - still return success
        console.log('User not found in auth users, returning generic success')
        return res.status(200).json({ 
          success: true, 
          message: 'If an account exists, verification code has been sent' 
        })
      }
    } catch (err) {
      console.error('Error checking user existence:', err)
      return res.status(500).json({ error: 'Failed to process request' })
    }
  }

  try {
    // Generate OTP
    const otp = generateOTP()
    const expires = Date.now() + (10 * 60 * 1000) // 10 minutes
    
    // Store OTP using shared store
    const otpKey = `${email}:${action}`
    setOTP(otpKey, { code: otp, expires, action })

    console.log('Generated OTP:', { otpKey, code: otp, expires: new Date(expires) })

    // Prepare email content
    const subject = action === 'password_reset' 
      ? 'COINSENSEI - Password Reset Verification Code'
      : 'COINSENSEI - Email Verification Code'

    const htmlContent = action === 'password_reset' ? `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Password Reset Verification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔐 COINSENSEI</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Password Reset Verification</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #495057; margin-top: 0;">Verify Your Identity</h2>
          
          <p>You requested a password reset for your COINSENSEI account. For security purposes, please verify your identity with the code below:</p>
          
          <div style="background: white; border: 2px solid #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
            <h3 style="color: #007bff; margin: 0 0 10px 0;">Verification Code</h3>
            <div style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; font-family: monospace;">
              ${otp}
            </div>
            <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 14px;">This code expires in 10 minutes</p>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>⚠️ Security Notice:</strong></p>
            <ul style="margin: 5px 0 0 0; color: #856404;">
              <li>Never share this code with anyone</li>
              <li>COINSENSEI will never ask for this code via phone or email</li>
              <li>If you didn't request this, please secure your account immediately</li>
            </ul>
          </div>
          
          <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
            If you didn't request this password reset, please ignore this email or contact our support team.
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #6c757d; font-size: 12px;">
          © 2024 COINSENSEI. All rights reserved.<br>
          This is an automated message, please do not reply.
        </div>
      </body>
      </html>
    ` : `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Email Verification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📧 COINSENSEI</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Email Verification</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #495057; margin-top: 0;">Verify Your Email</h2>
          
          <p>Please verify your email address with the following code:</p>
          
          <div style="background: white; border: 2px solid #28a745; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
            <h3 style="color: #28a745; margin: 0 0 10px 0;">Verification Code</h3>
            <div style="font-size: 32px; font-weight: bold; color: #28a745; letter-spacing: 5px; font-family: monospace;">
              ${otp}
            </div>
            <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 14px;">This code expires in 10 minutes</p>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #6c757d; font-size: 12px;">
          © 2024 COINSENSEI. All rights reserved.
        </div>
      </body>
      </html>
    `

    // Send email
    console.log('Attempting to send email to:', email)
    const emailResult = await transporter.sendMail({
      from: `"COINSENSEI Security" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html: htmlContent
    })
    
    console.log('Email sent successfully:', emailResult.messageId)

    // Clean up expired OTPs
    cleanupExpiredOTPs()

    return res.status(200).json({ 
      success: true, 
      message: 'Verification code sent to your email',
      action
    })

  } catch (error: any) {
    console.error('Email OTP send error:', error)
    
    if (error.code === 'EAUTH') {
      return res.status(500).json({ error: 'Email service authentication failed' })
    }

    return res.status(500).json({ error: error.message || 'Failed to send verification email' })
  }
}
