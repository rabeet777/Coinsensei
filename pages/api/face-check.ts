// pages/api/face-check.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../src/lib/supabase'   // adjust if your path differs

// The shape of our possible JSON responses
type JsonResponse =
  | { exists: false }
  | { exists: true; userId: string; distance: number }
  | { error: string }

// Euclidean distance helper
function euclid(a: number[], b: number[]) {
  return Math.hypot(...a.map((ai, i) => ai - b[i]))
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<JsonResponse>
) {
  // 1️⃣ Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res
      .status(405)
      .json({ error: `Method ${req.method} Not Allowed` })
  }

  // 2️⃣ Parse and validate body
  let descriptor: number[]
  try {
    const body = req.body as { descriptor: unknown }
    if (!Array.isArray(body.descriptor)) {
      throw new Error('`descriptor` must be an array of numbers')
    }
    // Ensure every element is a number
    descriptor = body.descriptor.map((x) => {
      if (typeof x !== 'number') {
        throw new Error('All elements in `descriptor` must be numbers')
      }
      return x
    })
  } catch (err: any) {
    console.error('🔴 Bad request body in /api/face-check:', err)
    return res.status(400).json({ error: err.message })
  }

  // 3️⃣ Fetch stored descriptors from Supabase
  const { data, error: dbError } = await supabase
    .from('face_encodings')
    .select('user_id, descriptor')

  if (dbError) {
    console.error('🔴 Supabase error in /api/face-check:', dbError)
    return res.status(500).json({ error: 'Database error' })
  }

  // 4️⃣ Compare distances
  let bestId: string | null = null
  let minDist = Infinity

  data!.forEach((row) => {
    const dist = euclid(descriptor, row.descriptor)
    if (dist < minDist) {
      minDist = dist
      bestId = row.user_id
    }
  })

  // 5️⃣ Return JSON result (threshold ~0.6)
  if (bestId && minDist < 0.6) {
    return res
      .status(200)
      .json({ exists: true, userId: bestId, distance: minDist })
  } else {
    return res.status(200).json({ exists: false })
  }
}
