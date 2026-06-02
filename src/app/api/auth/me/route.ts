import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      const response = NextResponse.json(
        { error: 'Não autorizado. Faça login.' },
        { status: 401 }
      );
      response.cookies.delete('englishflow_session');
      return response;
    }

    // Refresh streak logic
    let updatedStreak = user.streak;
    const now = new Date();

    if (user.lastActive) {
      const lastActiveDate = new Date(user.lastActive);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const isSameDay = lastActiveDate.toDateString() === now.toDateString();
      const isYesterday = lastActiveDate.toDateString() === yesterday.toDateString();

      if (!isSameDay && !isYesterday) {
        updatedStreak = 0;
        
        // Update user streak in DB
        await prisma.user.update({
          where: { id: user.id },
          data: { streak: 0 },
        });
        user.streak = 0;
      }
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
