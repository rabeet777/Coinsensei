// pages/api/mfa.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'

/** Incoming JSON for enroll (POST) */
interface EnrollBody {
  factorType: 'totp' | 'phone'
  friendlyName: string
  phone?: string
}

/** Incoming JSON for verify (PUT) */
interface VerifyBody {
  factorId: string
  challengeId: string
  code: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1) Initialize server‐side Supabase client (reads cookies)
  const supa = createServerSupabaseClient({ req, res })

  // 2) Authenticate
  const {
    data: { session },
    error: sessionError,
  } = await supa.auth.getSession()
  if (sessionError || !session?.user) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    switch (req.method) {
      // ─── GET: list enrolled factors ───
      case 'GET': {
        const { data: factors, error } = await supa.auth.mfa.listFactors()
        if (error) throw error
        return res.status(200).json({ factors })
      }

      // ─── POST: enroll a new factor ───
      case 'POST': {
        const body = req.body as EnrollBody

        // TOTP enrollment must have factorType:'totp'
        if (body.factorType === 'totp') {
          const { data, error } = await supa.auth.mfa.enroll({
            factorType: 'totp',
            friendlyName: body.friendlyName,
          })
          if (error) throw error
          return res.status(200).json({ totp: data })
        }

        // Phone SMS enrollment must have factorType:'phone' and phone
        if (body.factorType === 'phone') {
          if (!body.phone) {
            return res.status(400).json({ error: 'Missing phone number' })
          }
          const { data, error } = await supa.auth.mfa.enroll({
            factorType: 'phone',
            friendlyName: body.friendlyName,
            phone: body.phone,
          })
          if (error) throw error

          // Immediately send SMS challenge
          const { data: chal, error: chalErr } = await supa.auth.mfa.challenge({
            factorId: data.id,
          })
          if (chalErr) throw chalErr

          return res.status(200).json({ phone: data, challenge: chal })
        }

        return res.status(400).json({ error: 'Invalid factorType' })
      }

      // ─── PUT: verify an existing challenge ───
      case 'PUT': {
        const body = req.body as VerifyBody
        const { data, error } = await supa.auth.mfa.verify({
          factorId:    body.factorId,
          challengeId: body.challengeId,
          code:        body.code,
        })
        if (error) throw error
        return res.status(200).json({ verified: true, data })
      }

      default:
        res.setHeader('Allow', ['GET','POST','PUT'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }
  } catch (err: any) {
    console.error('MFA API error:', err)
    return res.status(400).json({ error: err.message })
  }
}
