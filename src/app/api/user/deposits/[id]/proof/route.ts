// src/app/api/user/deposits/[id]/proof/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // TODO: Implement proof upload functionality
  // parse file with formidable...
  // upload to supabase.storage.from('deposits-proofs')
  // update user_pkr_deposits set screenshot_url = publicUrl, updated_at=now() where id
  // return success
  return NextResponse.json({ message: 'Proof upload endpoint - not implemented yet', id })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // TODO: Implement proof upload functionality
  // parse file with formidable...
  // upload to supabase.storage.from('deposits-proofs')
  // update user_pkr_deposits set screenshot_url = publicUrl, updated_at=now() where id
  // return success
  return NextResponse.json({ message: 'Proof upload endpoint - not implemented yet', id })
}
