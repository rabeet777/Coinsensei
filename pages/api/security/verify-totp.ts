// pages/api/security/verify-totp.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import Twilio from 'twilio'

// 1️⃣ Pull in your Twilio creds from env
const accountSid      = process.env.TWILIO_ACCOUNT_SID!
const authToken       = process.env.TWILIO_AUTH_TOKEN!
const serviceSid      = process.env.TWILIO_VERIFY_SERVICE_SID!

if (!accountSid || !authToken || !serviceSid) {
  throw new Error(
    'Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN or TWILIO_VERIFY_SERVICE_SID'
  )
}

// 2️⃣ Init Twilio client
const client = Twilio(accountSid, authToken)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' })
  }

  const { identity, factorSid, authPayload, secret } = req.body as {
    identity?: string
    factorSid?: string
    authPayload?: string
    secret?: string
  }

  if (!identity || !factorSid || !authPayload) {
    return res
      .status(400)
      .json({ error: 'Must include identity, factorSid and authPayload' })
  }

  try {
    // 3️⃣ Attempt to verify the code
    const updated = await client.verify
      .services(serviceSid)
      .entities(identity)
      .factors(factorSid)
      .update({ authPayload })

    if (updated.status !== 'verified') {
      return res.status(400).json({ error: 'Invalid code' })
    }

    // 4️⃣ Return success plus factorSid & secret so client can persist them
    return res.status(200).json({
      verified:    true,
      factorSid,
      secret:      secret ?? null,
    })
  } catch (err: any) {
    console.error('Verify TOTP error:', err)
    return res
      .status(500)
      .json({ error: err.message || 'Unknown server error' })
  }
}
