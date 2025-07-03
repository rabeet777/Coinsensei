import type { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' })
  }

  const { email } = req.body as { email?: string }

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  // Check environment variables
  const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }

  console.log('SMTP Configuration:', {
    host: smtpConfig.host,
    port: smtpConfig.port,
    user: smtpConfig.user,
    passSet: !!smtpConfig.pass
  })

  if (!smtpConfig.host || !smtpConfig.user || !smtpConfig.pass) {
    return res.status(500).json({ 
      error: 'SMTP configuration missing',
      config: {
        hostSet: !!smtpConfig.host,
        userSet: !!smtpConfig.user,
        passSet: !!smtpConfig.pass
      }
    })
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: parseInt(smtpConfig.port || '587'),
      secure: false,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass
      }
    })

    // Test the connection
    await transporter.verify()
    console.log('SMTP connection verified successfully')

    // Send test email
    const result = await transporter.sendMail({
      from: `"COINSENSEI Test" <${smtpConfig.user}>`,
      to: email,
      subject: 'COINSENSEI Email Test',
      text: 'This is a test email from COINSENSEI to verify email configuration.',
      html: `
        <h2>✅ Email Test Successful</h2>
        <p>This is a test email from COINSENSEI to verify email configuration.</p>
        <p>If you receive this, your email settings are working correctly!</p>
        <hr>
        <small>Sent at: ${new Date().toISOString()}</small>
      `
    })

    console.log('Test email sent:', result.messageId)

    return res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId
    })

  } catch (error: any) {
    console.error('Email test error:', error)
    return res.status(500).json({
      error: 'Failed to send test email',
      details: error.message
    })
  }
} 