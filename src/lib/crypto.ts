import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

import { env } from '@/env'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  try {
    const key = Buffer.from(env.ENCRYPTION_KEY, 'hex')
    if (key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must decode to exactly 32 bytes')
    }
    return key
  } catch {
    throw new Error('Failed to parse ENCRYPTION_KEY. Ensure it is valid 32-byte hex.')
  }
}

export function encrypt(plaintext: string): string {
  try {
    if (!plaintext) {
      throw new Error('Plaintext cannot be empty')
    }

    const key = getEncryptionKey()
    const iv = randomBytes(IV_LENGTH)
    const cipher = createCipheriv(ALGORITHM, key, iv)
    const encrypted = Buffer.concat([
      cipher.update(Buffer.from(plaintext, 'utf8')),
      cipher.final()
    ])
    const authTag = cipher.getAuthTag()
    const payload = Buffer.concat([iv, authTag, encrypted])

    return payload.toString('base64')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown encryption error'
    throw new Error(`Encryption failed: ${message}`)
  }
}

export function decrypt(ciphertext: string): string {
  try {
    if (!ciphertext) {
      throw new Error('Ciphertext cannot be empty')
    }

    const payload = Buffer.from(ciphertext, 'base64')
    if (payload.length <= IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error('Ciphertext payload is too short')
    }

    const key = getEncryptionKey()
    const iv = payload.subarray(0, IV_LENGTH)
    const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
    const encrypted = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return decrypted.toString('utf8')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown decryption error'
    throw new Error(`Decryption failed: ${message}`)
  }
}
