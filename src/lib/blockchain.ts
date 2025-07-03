// src/lib/blockchain.ts
import { createRequire } from 'module'
import fetch from 'node-fetch'
import { deriveTronAccount } from './tronWallet'

// Pull in TronWeb as a CommonJS module
const requireCJS = createRequire(import.meta.url)
const TronWebMod = requireCJS('tronweb') as any
const TronWeb = (TronWebMod.default || TronWebMod) as {
  new (opts: {
    fullHost: string
    headers: Record<string,string>
    solidityNode?: string
    eventServer?: string
  }): any
}

// Non-null assertions on your required env vars
const TRON_FULL_HOST        = process.env.TRON_FULL_HOST!
const TRON_API_KEY          = process.env.TRON_API_KEY!
const TRON_TRC20_CONTRACT   = process.env.TRON_TRC20_CONTRACT!
const ADMIN_DERIVATION_INDEX= process.env.ADMIN_DERIVATION_INDEX!

if (!TRON_FULL_HOST)        throw new Error('Missing TRON_FULL_HOST')
if (!TRON_API_KEY)          throw new Error('Missing TRON_API_KEY')
if (!TRON_TRC20_CONTRACT)   throw new Error('Missing TRON_TRC20_CONTRACT')
if (!ADMIN_DERIVATION_INDEX)throw new Error('Missing ADMIN_DERIVATION_INDEX')

// Shared read-only client
export const tronWebRead = new TronWeb({
  fullHost: TRON_FULL_HOST,
  headers:  { 'TRON-PRO-API-KEY': TRON_API_KEY }
})

async function getAdminTronWeb(): Promise<{
  tronWeb: any
  adminAddr: string
  adminKey:  string
}> {
  const idx = Number(ADMIN_DERIVATION_INDEX)
  const { address: adminAddr, privateKey: adminKey } = await deriveTronAccount(idx)

  const tw: any = new TronWeb({
    fullHost:     TRON_FULL_HOST,
    solidityNode: TRON_FULL_HOST,
    eventServer:  TRON_FULL_HOST,
    headers:      { 'TRON-PRO-API-KEY': TRON_API_KEY }
  })

  return { tronWeb: tw, adminAddr, adminKey }
}

export async function getUsdtBalance(address: string): Promise<number> {
  const res = await fetch(`${TRON_FULL_HOST}/v1/accounts/${address}/wallet/trc20`, {
    headers: { 'TRON-PRO-API-KEY': TRON_API_KEY }
  })
  const body = await res.json()
  const token = (body.data || []).find((t: any) => t.tokenId === TRON_TRC20_CONTRACT)
  return token ? Number(token.balance) / 1e6 : 0
}

export async function topupTrxIfNeeded(
  userAddress: string,
  minTrx = 1.5
): Promise<string> {
  const balSun: number = await tronWebRead.trx.getBalance(userAddress)
  if (balSun / 1e6 >= minTrx) return ''

  const { tronWeb, adminAddr, adminKey } = await getAdminTronWeb()
  const topUpSun = Math.ceil((minTrx - balSun/1e6 + 0.1) * 1e6)

  const unsignedTx = await tronWeb.transactionBuilder.sendTrx(
    userAddress,
    topUpSun,
    adminAddr
  )
  const signed = await tronWeb.trx.sign(unsignedTx, adminKey)
  const { txid } = await tronWeb.trx.sendRawTransaction(signed)
  return txid
}

export async function adminTransferFromUser(
  userAddr: string,
  amount: number
): Promise<string> {
  const { tronWeb, adminAddr, adminKey } = await getAdminTronWeb()
  const sunAmt = Math.floor(amount * 1e6)

  const built = await tronWeb.transactionBuilder.triggerSmartContract(
    TRON_TRC20_CONTRACT,
    'transferFrom(address,address,uint256)',
    { feeLimit: 1_000_000_000, callValue: 0 },
    [
      { type: 'address', value: userAddr },
      { type: 'address', value: adminAddr },
      { type: 'uint256', value: sunAmt.toString() }
    ],
    adminAddr
  )
  if (!built.result || !built.transaction) {
    throw new Error(`Build failed: ${JSON.stringify(built)}`)
  }

  const signed = await tronWeb.trx.sign(built.transaction, adminKey)
  const { result, txid, message } = await tronWeb.trx.sendRawTransaction(signed)
  if (!result) {
    const msg = message ? Buffer.from(message, 'hex').toString() : 'Rejected'
    throw new Error(`Broadcast failed: ${msg}`)
  }
  return txid
}

export { getAdminTronWeb };
