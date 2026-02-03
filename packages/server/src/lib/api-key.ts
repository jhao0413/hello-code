import { randomBytes, createHash } from 'node:crypto';

/**
 * Generates a new API key with format: hc_xxxxxxxxxxxxxxxxxxxxxxxx
 * The key is 24 characters of base32-encoded random bytes after the hc_ prefix
 */
export function generateApiKey(): string {
  // Generate 15 random bytes (120 bits of entropy)
  const randomBytesBuffer = randomBytes(15);

  // Convert to base32 (custom alphabet for readability)
  const base32Alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
  let result = '';
  let bits = 0;
  let value = 0;

  for (let i = 0; i < randomBytesBuffer.length; i++) {
    value = (value << 8) | randomBytesBuffer[i];
    bits += 8;

    while (bits >= 5) {
      result += base32Alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += base32Alphabet[(value << (5 - bits)) & 31];
  }

  return `hc_${result}`;
}

/**
 * Hashes an API key using SHA-256
 * @param key - The API key to hash
 * @returns The hexadecimal hash string
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Verifies if a given API key matches the stored hash
 * @param key - The API key to verify
 * @param hash - The stored hash to compare against
 * @returns True if the key matches the hash
 */
export function verifyApiKey(key: string, hash: string): boolean {
  const keyHash = hashApiKey(key);
  return keyHash === hash;
}

/**
 * Extracts the prefix of an API key for display purposes
 * Returns the first 12 characters (hc_ + 8 chars)
 * @param key - The full API key
 * @returns The key prefix for display
 */
export function getKeyPrefix(key: string): string {
  return key.substring(0, 12);
}

/**
 * Validates API key format
 * @param key - The API key to validate
 * @returns True if the key has valid format
 */
export function isValidApiKeyFormat(key: string): boolean {
  return /^hc_[a-z2-7]{24,}$/.test(key);
}
