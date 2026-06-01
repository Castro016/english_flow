import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    // 1. Fetch user study progress history
    const progressList = await prisma.progress.findMany({
      where: { userId: user.id },
      include: {
        lesson: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // 2. Fetch ALL achievements in the database
    const achievements = await prisma.achievement.findMany();

    // 3. Fetch list of unlocked achievement IDs for current user
    const unlockedAchievements = await prisma.userAchievement.findMany({
      where: { userId: user.id },
    });

    const unlockedIds = new Set(unlockedAchievements.map((ua) => ua.achievementId));

    // Combine achievements with user unlocked status
    const mappedAchievements = achievements.map((ach) => {
      const isUnlocked = unlockedIds.has(ach.id);
      const unlockedRecord = unlockedAchievements.find((ua) => ua.achievementId === ach.id);
      
      return {
        ...ach,
        unlocked: isUnlocked,
        unlockedAt: unlockedRecord ? unlockedRecord.unlockedAt : null,
      };
    });

    return NextResponse.json({
      success: true,
      user,
      progressHistory: progressList,
      achievements: mappedAchievements,
    });
  } catch (error) {
    console.error('Error fetching profile detail:', error);
    return NextResponse.json(
      { error: 'Erro interno ao carregar perfil.' },
      { status: 500 }
    );
  }
}
