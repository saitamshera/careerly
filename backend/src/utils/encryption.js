const crypto = require('crypto');
const { env } = require('../config/env');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a 32-byte encryption key from JWT_ACCESS_SECRET.
 * In production, use a dedicated ENCRYPTION_KEY env var instead.
 */
function getEncryptionKey() {
  const secret = env.ENCRYPTION_KEY || env.JWT_ACCESS_SECRET;
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a JSON-serializable value using AES-256-GCM.
 * Returns a string in the format: iv:authTag:ciphertext (all hex-encoded).
 */
function encrypt(data) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const plaintext = JSON.stringify(data);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string back to its original value.
 * Returns the parsed JSON object, or null if decryption fails.
 */
function decrypt(encryptedString) {
  if (!encryptedString || typeof encryptedString !== 'string' || !encryptedString.includes(':')) {
    return null;
  }

  try {
    const key = getEncryptionKey();
    const [ivHex, authTagHex, ciphertext] = encryptedString.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

module.exports = { encrypt, decrypt };
