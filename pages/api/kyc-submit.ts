// pages/api/kyc-submit.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  // 1) validate user token
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' })
  const token = auth.split(' ')[1]

  const { data:{ user }, error: uErr } = await supabaseAdmin.auth.getUser(token)
  if (uErr || !user) return res.status(401).json({ error: 'Invalid auth' })

  // 2) validate body
  const { docType, frontUrl, backUrl, addressUrl } = req.body
  if (!docType || !frontUrl || !backUrl || !addressUrl) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  // 3) insert under service role
  const { error: insErr } = await supabaseAdmin
    .from('user_kyc_submissions')
    .insert({
      user_id:     user.id,
      doc_type:    docType,
      front_url:   frontUrl,
      back_url:    backUrl,
      address_url: addressUrl,
      status:      'pending',
    })
  if (insErr) {
    console.error('Insert failed:', insErr)
    return res.status(500).json({ error: insErr.message })
  }

  // 4) also upsert your profile status if you like
  await supabaseAdmin
    .from('user_profile')
    .upsert({ id: user.id, kyc_status: 'pending' }, { onConflict: 'id' })

  return res.status(200).json({ ok: true })
}
