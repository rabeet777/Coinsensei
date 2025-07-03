// src/lib/mailer.ts
import nodemailer from 'nodemailer'

/**
 * Configure your SMTP transporter. 
 * Make sure to set these in your `.env.local` (or in Vercel/Netlify dashboard):
 *
 *   MAIL_HOST=smtp.mailtrap.io
 *   MAIL_PORT=2525
 *   MAIL_USER=your_smtp_username
 *   MAIL_PASS=your_smtp_password
 */
const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST,
  port:   Number(process.env.MAIL_PORT ?? 587),
  secure: Number(process.env.MAIL_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
})

export interface MailOptions {
  to:      string            // recipient email
  subject: string
  text?:   string           // plain‑text body
  html?:   string           // HTML body
}

/**
 * Send an email. Throws if something goes wrong.
 */
export default async function mailer(opts: MailOptions) {
  if (!transporter) {
    throw new Error('SMTP transporter not configured')
  }

  const info = await transporter.sendMail({
    from:    process.env.MAIL_FROM ?? `"No Reply" <noreply@example.com>`,
    to:      opts.to,
    subject: opts.subject,
    text:    opts.text,
    html:    opts.html,
  })

  // you can log info.messageId or info.response here if you like
  return info
}
