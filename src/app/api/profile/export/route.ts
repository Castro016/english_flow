import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    // 1. Gather all study progress logs
    const progressList = await prisma.progress.findMany({
      where: { userId: user.id },
      include: { lesson: true },
    });

    // 2. Gather all unlocked achievements
    const achievementsList = await prisma.userAchievement.findMany({
      where: { userId: user.id },
      include: { achievement: true },
    });

    // 3. Gather all security audit logs relating to this user
    const auditLogs = await prisma.auditLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    // 4. Build LGPD export package
    const exportPackage = {
      exportedAt: new Date().toISOString(),
      regulationCompliance: 'LGPD (Lei Geral de Proteção de Dados)',
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        createdAt: user.createdAt,
      },
      studyProgress: progressList.map((p) => ({
        lessonTitle: p.lesson.title,
        lessonDifficulty: p.lesson.difficulty,
        lessonLevel: p.lesson.level,
        completed: p.completed,
        scoreEarned: p.score,
        updatedAt: p.updatedAt,
      })),
      unlockedAchievements: achievementsList.map((a) => ({
        name: a.achievement.name,
        description: a.achievement.description,
        icon: a.achievement.icon,
        xpReward: a.achievement.xpReward,
        unlockedAt: a.unlockedAt,
      })),
      securityAuditLogs: auditLogs.map((log) => ({
        action: log.action,
        ip: log.ip,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
        details: log.details ? JSON.parse(log.details) : null,
      })),
    };

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    // Write audit log for data export request
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LGPD_DATA_EXPORT_SUCCESS',
        ip,
        userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      data: exportPackage,
    });
  } catch (error) {
    console.error('Error exporting LGPD data:', error);
    return NextResponse.json({ error: 'Erro ao exportar dados.' }, { status: 500 });
  }
}
