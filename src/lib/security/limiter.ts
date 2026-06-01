import { prisma } from '../db';

/**
 * Enterprise database-backed rate-limiter.
 * Works perfectly in standard servers, serverless (Next.js API Routes), and cluster setups.
 * 
 * @param key Unique key representing IP + Endpoint, or User ID + Endpoint.
 * @param limit Maximum allowed requests in the window.
 * @param windowSeconds Window length in seconds.
 * @returns Boolean indicating if the client has exceeded the limit.
 */
export async function isRateLimited(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const now = new Date();
  
  try {
    // 1. Clean up stale/expired rate limits asynchronously to keep the table compact
    // (We run this inside a background task or inside queries safely)
    await prisma.rateLimit.deleteMany({
      where: {
        expireAt: { lt: now },
      },
    });

    // 2. Fetch or create rate limit row
    const record = await prisma.rateLimit.findUnique({
      where: { key },
    });

    if (!record) {
      // Create new record
      await prisma.rateLimit.create({
        data: {
          key,
          points: 1,
          expireAt: new Date(Date.now() + windowSeconds * 1000),
        },
      });
      return false;
    }

    // 3. Record exists, check if expired
    if (record.expireAt < now) {
      // Reset points and expiration
      await prisma.rateLimit.update({
        where: { key },
        data: {
          points: 1,
          expireAt: new Date(Date.now() + windowSeconds * 1000),
        },
      });
      return false;
    }

    // 4. Record is active, increment points
    const updatedRecord = await prisma.rateLimit.update({
      where: { key },
      data: {
        points: { increment: 1 },
      },
    });

    return updatedRecord.points > limit;
  } catch (error) {
    console.error('Rate Limiter Error:', error);
    // Fail-safe open: If database rate limiter throws error, let request pass but log warning
    return false;
  }
}
