// src/lib/tronWallet.ts
import { createRequire } from 'module'
import crypto from 'crypto'
const requireCJS = createRequire(import.meta.url)
const requireUtil = createRequire(import.meta.url)
const { deriveTronAddress } = requireUtil('../../tronAddressFromMnemonic.cjs')

// pull in CJS modules
const bip39 = requireCJS('bip39')    as typeof import('bip39')
const HDKey = requireCJS('hdkey')    as typeof import('hdkey')
import secp256k1 from 'secp256k1'
import pkg from 'js-sha3'
const { keccak_256 } = pkg
import bs58check from 'bs58check'

// lazy TronWeb loader
let _tronWeb: any = null
export async function getTronWeb() {
  if (!_tronWeb) {
    const mod = await import('tronweb')
    const TronWebClass = mod.default || mod
    _tronWeb = new TronWebClass({
      fullNode: process.env.TRON_FULL_HOST!,
      solidityNode: process.env.TRON_FULL_HOST!,
      eventServer: process.env.TRON_FULL_HOST!,
      headers:   { 'TRON-PRO-API-KEY': process.env.TRON_API_KEY! }
    })
  }
  return _tronWeb
}

// ✅ Secure mnemonic decryption
function decryptMnemonic(): string {
  const encryptedMnemonic = process.env.ENCRYPTED_HDWALLET_MNEMONIC!
  const encryptionKey = process.env.WALLET_ENCRYPTION_KEY
  const iv = process.env.WALLET_IV
  const authTag = process.env.WALLET_AUTH_TAG
  
  // Check if all encryption components are available
  if (!encryptionKey || !iv || !authTag) {
    console.warn('⚠️ Encryption keys not found. Using fallback to plain text mnemonic.')
    // Fallback to plain text mnemonic (temporary for migration)
    const plainMnemonic = process.env.HDWALLET_MNEMONIC
    if (plainMnemonic) {
      return plainMnemonic
    }
    throw new Error('Neither encrypted nor plain text mnemonic found in environment')
  }
  
  try {
    const algorithm = 'aes-256-gcm'
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKey, 'hex'), Buffer.from(iv, 'hex'))
    decipher.setAuthTag(Buffer.from(authTag, 'hex'))
    
    let decrypted = decipher.update(encryptedMnemonic, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Failed to decrypt mnemonic:', error)
    throw new Error('Wallet decryption failed')
  }
}

// ✅ Lazy initialization - decrypt only when needed
let _cachedMnemonic: string | null = null
function getMnemonic(): string {
  if (!_cachedMnemonic) {
    _cachedMnemonic = decryptMnemonic()
  }
  return _cachedMnemonic
}

/**
 * ✅ Secure derivation with user-specific entropy
 */
export async function deriveTronAccount(index: number, userId?: string) {
  const mnemonic = getMnemonic()
  
  // ✅ Add user-specific entropy to make addresses less predictable
  let secureIndex = index
  if (userId) {
    const userSalt = crypto.createHash('sha256').update(userId).digest('hex').slice(0, 8)
    secureIndex = parseInt(userSalt, 16) % 1000000 + index // Modulo to keep numbers reasonable
  }
  
  const { address, privateKey, path } = deriveTronAddress(mnemonic, secureIndex)
  
  return { address, privateKey, derivationPath: path }
}
