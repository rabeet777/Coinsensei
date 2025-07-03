// scripts/sendToUser.js
require('dotenv').config({ path: '.env.local' })

const bip39  = require('bip39')
const HDKey  = require('hdkey')
const TronWeb= require('tronweb')

// read your .env.vars
const {
  HDWALLET_MNEMONIC,
  TRON_FULL_HOST,
  TRON_API_KEY,
  TEST_TRC20_CONTRACT_ADDRESS,
  USER_DEPOSIT_ADDRESS,
  SENDER_DERIVATION_INDEX
} = process.env

if (!HDWALLET_MNEMONIC ||
    !TRON_FULL_HOST ||
    !TRON_API_KEY ||
    !TEST_TRC20_CONTRACT_ADDRESS ||
    !USER_DEPOSIT_ADDRESS ||
    !SENDER_DERIVATION_INDEX) {
  console.error('❌ Please set all required env vars in .env.local')
  process.exit(1)
}

// derive a private key from your mnemonic & index
function derivePrivateKey(index) {
  const path = `m/44'/195'/0'/0/${index}`
  const seed = bip39.mnemonicToSeedSync(HDWALLET_MNEMONIC)
  const master = HDKey.fromMasterSeed(seed)
  const child  = master.derive(path)
  if (!child.privateKey) throw new Error('no privateKey')
  return child.privateKey.toString('hex')
}

async function main() {
  const idx        = parseInt(SENDER_DERIVATION_INDEX, 10)
  const privateKey = derivePrivateKey(idx)

  // init TronWeb (CJS version)
  const tronWeb    = new TronWeb({
    fullHost: TRON_FULL_HOST,
    headers:  { 'TRON-PRO-API-KEY': TRON_API_KEY }
  })

  // attach your TRC-20 contract
  const contract = await tronWeb
    .contract()
    .at(TEST_TRC20_CONTRACT_ADDRESS)

  // amount in “sun” (6 decimals)
  const tokens   = 10
  const sunAmount= Math.floor(tokens * 1e6)

  console.log(`🚀 Sending ${tokens} tokens to ${USER_DEPOSIT_ADDRESS}…`)
  const txId = await contract.transfer(
    USER_DEPOSIT_ADDRESS,
    sunAmount
  ).send({ feeLimit:1_000_000_000, privateKey })

  console.log('✅ Transfer sent with TX ID:', txId)
}

main().catch(err => {
  console.error('❌ sendToUser.js failed:', err)
  process.exit(1)
})
