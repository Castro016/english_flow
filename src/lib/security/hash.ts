import { hash, verify } from '@node-rs/argon2';

/**
 * Hash a password using the secure Argon2id algorithm.
 * Automatically handles secure salt generation.
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 65536, // 64 MB (Standard OWASP / NIST suggestion)
    timeCost: 3,       // 3 Iterations
    outputLen: 32,
    parallelism: 4,
  });
}

/**
 * Verify a plaintext password against an Argon2id hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await verify(hash, password);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}
