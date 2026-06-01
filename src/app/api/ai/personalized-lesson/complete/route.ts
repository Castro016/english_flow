import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const { xpEarned } = await req.json();
    const finalXpEarned = typeof xpEarned === 'number' && xpEarned > 0 ? xpEarned : 40; // Default +40 XP

    const now = new Date();
    let newStreak = dbUser.streak;

    if (dbUser.lastActive) {
      const lastActiveDate = new Date(dbUser.lastActive);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const isSameDay = lastActiveDate.toDateString() === now.toDateString();
      const isYesterday = lastActiveDate.toDateString() === yesterday.toDateString();

      if (isYesterday) {
        newStreak += 1;
      } else if (!isSameDay) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const newXp = dbUser.xp + finalXpEarned;
    const newLevel = Math.floor(Math.sqrt(newXp) / 10) + 1;
    const didLevelUp = newLevel > dbUser.level;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        lastActive: now,
      },
    });

    // Write audit log
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'AI_PERSONALIZED_LESSON_COMPLETED',
        ip,
        userAgent,
        details: JSON.stringify({ xpAwarded: finalXpEarned, streak: newStreak }),
      },
    });

    return NextResponse.json({
      success: true,
      xpEarned: finalXpEarned,
      newTotalXp: newXp,
      newLevel,
      didLevelUp,
      newStreak,
    });
  } catch (error) {
    console.error('Error completing AI personalized lesson:', error);
    return NextResponse.json({ error: 'Erro ao salvar progresso da lição personalizada.' }, { status: 500 });
  }
}
