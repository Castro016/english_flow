import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signToken, setSessionCookie } from '@/lib/auth';
import { verifyPassword } from '@/lib/security/hash';
import { isRateLimited } from '@/lib/security/limiter';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitKey = `rate:login:${ip}`;
    const limited = await isRateLimited(rateLimitKey, 10, 60); // 10 attempts per minute
    if (limited) {
      return NextResponse.json(
        { error: 'Muitas tentativas de login. Tente novamente em 1 minuto.' },
        { status: 429 }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const safeEmail = email.trim().toLowerCase();

    // Fetch user with brute force tracking fields
    const user = await prisma.user.findUnique({
      where: { email: safeEmail },
    });

    const userAgent = req.headers.get('user-agent') || 'Unknown';

    if (!user) {
      // Return generic credential failure to prevent account enumeration
      return NextResponse.json(
        { error: 'Credenciais inválidas.' },
        { status: 401 }
      );
    }

    // 1. Check account lockout state
    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      const minutesRemaining = Math.ceil(
        (user.lockedUntil.getTime() - now.getTime()) / (1000 * 60)
      );
      
      // Write audit log for locked account abuse attempt
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'AUTH_LOGIN_LOCKED_ABUSE',
          ip,
          userAgent,
          details: JSON.stringify({ email: user.email, minutesRemaining }),
        },
      });

      return NextResponse.json(
        { error: `Conta bloqueada temporariamente. Tente novamente em ${minutesRemaining} minutos.` },
        { status: 423 }
      );
    }

    // 2. Verify password using Argon2id
    const passwordMatch = await verifyPassword(password, user.password);

    if (!passwordMatch) {
      // Increment failed attempts
      const newFailedAttempts = user.failedLoginAttempts + 1;
      const shouldLock = newFailedAttempts >= 5;
      const lockDuration = shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null; // 15 mins lock

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: shouldLock ? 0 : newFailedAttempts,
          lockedUntil: lockDuration,
        },
      });

      // Write audit log for failed login attempt
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: shouldLock ? 'AUTH_LOCKOUT_TRIGGERED' : 'AUTH_LOGIN_FAILED',
          ip,
          userAgent,
          details: JSON.stringify({
            email: user.email,
            attemptCount: newFailedAttempts,
            locked: shouldLock,
          }),
        },
      });

      return NextResponse.json(
        { error: shouldLock ? 'Múltiplas tentativas incorretas. Conta bloqueada por 15 minutos.' : 'Credenciais inválidas.' },
        { status: 401 }
      );
    }

    // 3. Successful login - Reset lockout tracking
    let updatedStreak = user.streak;
    
    if (user.lastActive) {
      const lastActiveDate = new Date(user.lastActive);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const isSameDay = lastActiveDate.toDateString() === now.toDateString();
      const isYesterday = lastActiveDate.toDateString() === yesterday.toDateString();

      if (!isSameDay && !isYesterday) {
        updatedStreak = 0;
      }
    } else {
      updatedStreak = 0;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        streak: updatedStreak,
        lastActive: now,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        xp: true,
        level: true,
        streak: true,
        lastActive: true,
        dailyGoalXp: true,
        role: true,
        createdAt: true,
      }
    });

    const token = signToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    });

    await setSessionCookie(token);

    // Write audit log for successful login
    await prisma.auditLog.create({
      data: {
        userId: updatedUser.id,
        action: 'AUTH_LOGIN_SUCCESS',
        ip,
        userAgent,
        details: JSON.stringify({ email: updatedUser.email }),
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Error during login API:', error);
    return NextResponse.json(
      { error: error?.message || 'Ocorreu um erro interno no servidor.' },
      { status: 500 }
    );
  }
}
