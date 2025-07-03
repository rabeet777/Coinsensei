// lib/encryption.ts
import crypto from 'crypto'

// 32‑byte hex key stored in ENV
const KEY = Buffer.from(process.env.CUSTODIAL_WALLET_ENCRYPTION_KEY!, 'hex')
if (KEY.length !== 32) {
  throw new Error('CUSTODIAL_WALLET_ENCRYPTION_KEY must be 32‑byte hex')
}

// Encrypt plaintext → base64(iv|authTag|ciphertext)
export function encryptPrivateKey(plain: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv)
  const ciphertext = Buffer.concat([
    cipher.update(plain, 'utf8'),
    cipher.final()
  ])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, ciphertext]).toString('base64')
}

// Decrypt from base64(iv|authTag|ciphertext) → plaintext
export function decryptPrivateKey(enc: string): string {
  const data = Buffer.from(enc, 'base64')
  const iv = data.slice(0, 12)
  const tag = data.slice(12, 28)
  const ciphertext = data.slice(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv)
  decipher.setAuthTag(tag)
  const plain = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]).toString('utf8')
  return plain
}
