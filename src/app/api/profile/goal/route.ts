import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { dailyGoalXp } = await req.json();

    if (typeof dailyGoalXp !== 'number' || dailyGoalXp <= 0) {
      return NextResponse.json({ error: 'Meta diária inválida.' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { dailyGoalXp },
    });

    return NextResponse.json({
      success: true,
      dailyGoalXp: updatedUser.dailyGoalXp,
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json({ error: 'Erro ao atualizar meta.' }, { status: 500 });
  }
}
