import { hash as bcryptHash, compare as bcryptCompare } from 'bcryptjs';

/**
 * Hash a password using bcrypt (pure JavaScript, serverless compatible).
 */
export async function hashPassword(password: string): Promise<string> {
  return bcryptHash(password, 10);
}

/**
 * Verify a plaintext password against either a bcrypt hash or legacy Argon2id hash.
 */
export async function verifyPassword(password: string, hashVal: string): Promise<boolean> {
  try {
    if (hashVal.startsWith('$argon2')) {
      // Dynamic import to prevent crash at startup in serverless environments if native modules fail to bundle
      const { verify } = await import('@node-rs/argon2');
      return await verify(hashVal, password);
    }
    
    return await bcryptCompare(password, hashVal);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}
