import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id: lessonId } = await context.params;
    const { xpEarned } = await req.json();

    if (typeof xpEarned !== 'number' || xpEarned < 0) {
      return NextResponse.json({ error: 'XP inválido.' }, { status: 400 });
    }

    // 1. Get lesson difficulty to calculate base score
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lição não encontrada.' }, { status: 404 });
    }

    // 2. Fetch or create Progress
    const existingProgress = await prisma.progress.findUnique({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId,
        },
      },
    });

    const isFirstTimeCompleted = !existingProgress?.completed;

    await prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId,
        },
      },
      update: {
        completed: true,
        score: xpEarned,
      },
      create: {
        userId: user.id,
        lessonId,
        completed: true,
        score: xpEarned,
      },
    });

    // 3. Update User stats: Streak, lastActive, XP, level
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const now = new Date();
    let newStreak = dbUser.streak;
    let streakUpdated = false;

    if (dbUser.lastActive) {
      const lastActiveDate = new Date(dbUser.lastActive);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const isSameDay = lastActiveDate.toDateString() === now.toDateString();
      const isYesterday = lastActiveDate.toDateString() === yesterday.toDateString();

      if (isYesterday) {
        newStreak += 1;
        streakUpdated = true;
      } else if (!isSameDay) {
        // Was inactive for more than a day, reset streak to 1
        newStreak = 1;
        streakUpdated = true;
      }
    } else {
      // First time studying ever
      newStreak = 1;
      streakUpdated = true;
    }

    // Add XP earned (only count full XP if it's the first time completing, or give minor repetition XP of 5 XP)
    const xpToAdd = isFirstTimeCompleted ? xpEarned : 5;
    const newXp = dbUser.xp + xpToAdd;

    // Calculate new level: level = Math.floor(Math.sqrt(newXp) / 10) + 1
    const newLevel = Math.floor(Math.sqrt(newXp) / 10) + 1;
    const didLevelUp = newLevel > dbUser.level;

    // Update user in DB
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        lastActive: now,
      },
    });

    // 4. Achievement unlocking evaluation
    const achievementsToUnlock = [];
    const allAchievements = await prisma.achievement.findMany();
    const alreadyUnlocked = await prisma.userAchievement.findMany({
      where: { userId: user.id },
    });
    const unlockedIds = new Set(alreadyUnlocked.map((a) => a.achievementId));

    // Gather completed lessons count
    const completedLessonsCount = await prisma.progress.count({
      where: { userId: user.id, completed: true },
    });

    for (const ach of allAchievements) {
      if (unlockedIds.has(ach.id)) continue;

      let meetsRequirement = false;

      if (ach.requirement === 'FIRST_LESSON' && completedLessonsCount >= ach.value) {
        meetsRequirement = true;
      } else if (ach.requirement === 'STREAK_7' && newStreak >= ach.value) {
        meetsRequirement = true;
      } else if (ach.requirement === 'STREAK_30' && newStreak >= ach.value) {
        meetsRequirement = true;
      } else if (ach.requirement === 'XP_1000' && newXp >= ach.value) {
        meetsRequirement = true;
      } else if (ach.requirement === 'LESSONS_10' && completedLessonsCount >= ach.value) {
        meetsRequirement = true;
      }

      if (meetsRequirement) {
        achievementsToUnlock.push(ach);
      }
    }

    // Unlock achievements and reward XP
    let totalXpBonus = 0;
    const newlyUnlockedAchievements = [];

    for (const ach of achievementsToUnlock) {
      await prisma.userAchievement.create({
        data: {
          userId: user.id,
          achievementId: ach.id,
        },
      });
      totalXpBonus += ach.xpReward;
      newlyUnlockedAchievements.push(ach);
    }

    if (totalXpBonus > 0) {
      // Add bonus XP to user
      const finalXp = updatedUser.xp + totalXpBonus;
      const finalLevel = Math.floor(Math.sqrt(finalXp) / 10) + 1;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          xp: finalXp,
          level: finalLevel,
        },
      });
      
      updatedUser.xp = finalXp;
      updatedUser.level = finalLevel;
    }

    return NextResponse.json({
      success: true,
      xpEarned: xpToAdd,
      xpBonus: totalXpBonus,
      newTotalXp: updatedUser.xp,
      newLevel: updatedUser.level,
      didLevelUp,
      newStreak: updatedUser.streak,
      unlockedAchievements: newlyUnlockedAchievements,
    });
  } catch (error) {
    console.error('Error completing lesson:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar o progresso da lição.' },
      { status: 500 }
    );
  }
}
