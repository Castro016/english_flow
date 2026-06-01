import crypto from 'crypto';

/**
 * Custom Base32 decoding helper to parse secrets for TOTP.
 */
function decodeBase32(base32: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.toUpperCase().replace(/=+$/, '');
  let bits = '';
  let value = 0;
  
  for (let i = 0; i < clean.length; i++) {
    const val = alphabet.indexOf(clean[i]);
    if (val === -1) throw new Error('Invalid base32 character');
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }

  return Buffer.from(bytes);
}

/**
 * Generate a 6-digit TOTP token for a base32 secret key at a specific timestamp.
 */
export function generateTOTP(secretBase32: string, timeStepWindow = 0): string {
  const key = decodeBase32(secretBase32);
  const time = Math.floor(Date.now() / 1000 / 30) + timeStepWindow;
  
  // Convert time to 8-byte big-endian buffer
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(0, 0); // High 32 bits
  buffer.writeUInt32BE(time, 4); // Low 32 bits

  // Calculate HMAC-SHA1
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(buffer);
  const hash = hmac.digest();

  // Dynamic truncation
  const offset = hash[19] & 0xf;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verify a user's 6-digit TOTP token.
 * Supports a clock-drift window of +/- 1 time step (30 seconds) for reliability.
 */
export function verifyTOTP(token: string, secretBase32: string): boolean {
  if (!token || token.length !== 6) return false;

  // Verify against current step, previous step, and next step
  for (let i = -1; i <= 1; i++) {
    const generated = generateTOTP(secretBase32, i);
    if (generated === token) {
      return true;
    }
  }

  return false;
}

/**
 * Generate a secure random base32 key for MFA activation.
 */
export function generateMFASecret(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = crypto.randomBytes(20);
  let secret = '';
  for (let i = 0; i < bytes.length; i++) {
    secret += alphabet[bytes[i] % alphabet.length];
  }
  return secret;
}
