// src/lib/tronResources.ts
import { createRequire } from 'module'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Temporary hardcoded values for testing
const TRON_FULL_HOST = 'https://nile.trongrid.io'
const TRON_API_KEY = process.env.TRON_API_KEY || ''
const HDWALLET_MNEMONIC = process.env.HDWALLET_MNEMONIC || ''

if (!TRON_API_KEY || !HDWALLET_MNEMONIC) {
  throw new Error('Missing TRON_API_KEY or HDWALLET_MNEMONIC in env')
}

// Load the CJS entry point, then pull out default if present
const requireCJS = createRequire(import.meta.url)
const tronwebMod  = requireCJS('tronweb')
const TronWebCls  = tronwebMod.default || tronwebMod

// Now instantiate your singleton
export const tronWeb = new TronWebCls({
  fullHost:     TRON_FULL_HOST,
  solidityNode: TRON_FULL_HOST,
  eventServer:  TRON_FULL_HOST,
  headers:      { 'TRON-PRO-API-KEY': TRON_API_KEY }
})
