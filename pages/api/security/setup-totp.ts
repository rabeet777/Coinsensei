// pages/api/security/setup-totp.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import Twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID!
const authToken  = process.env.TWILIO_AUTH_TOKEN!
const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID!

const client = Twilio(accountSid, authToken)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { identity, friendlyName } = req.body as {
    identity?: string
    friendlyName?: string
  }
  if (!identity) {
    return res.status(400).json({ error: 'Missing identity' })
  }

  try {
    // 1) ensure the Entity exists
    try {
      await client.verify.services(serviceSid).entities(identity).fetch()
    } catch (err: any) {
      if (err.status === 404 || err.code === 20404) {
        await client.verify.services(serviceSid).entities.create({ identity })
      } else {
        throw err
      }
    }

    // 2) create a new TOTP factor
    const factor = await client.verify
      .services(serviceSid)
      .entities(identity)
      .newFactors
      .create({
        factorType: 'totp',
        friendlyName: friendlyName || identity,
      })

    // 3) respond with SID, URI (for QR), and the raw secret
    return res.status(200).json({
      factorSid: factor.sid,
      uri: factor.binding.uri,
      secret: factor.binding.secret,
    })
  } catch (err: any) {
    console.error('setup-totp error', err)
    return res.status(500).json({ error: err.message })
  }
}
