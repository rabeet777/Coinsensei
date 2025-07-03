import path from 'path'
import dotenv from 'dotenv'
import { createRequire } from 'module'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const requireCJS = createRequire(import.meta.url)
const _tronweb = requireCJS('tronweb')
const TronWeb   = (_tronweb.default ?? _tronweb) as any

if (typeof TronWeb !== 'function') {
  console.error('❌ STILL NOT A CONSTRUCTOR!')
  process.exit(1)
}

const tronWeb = new TronWeb({
  fullNode:     process.env.TRON_FULL_HOST!,
  solidityNode: process.env.TRON_FULL_HOST!,
  eventServer:  process.env.TRON_FULL_HOST!,
  headers:      { 'TRON-PRO-API-KEY': process.env.TRON_API_KEY! }
})

console.log('✅ Success – TronWeb version:')
