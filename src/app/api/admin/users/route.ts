import { NextResponse } from 'next/server';
import { getSessionUser, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function checkAdminAccess() {
  const user = await getSessionUser();
  if (!user || !hasRole(user.role, 'ADMIN')) {
    return false;
  }
  return true;
}

export async function GET() {
  if (!(await checkAdminAccess())) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        xp: true,
        level: true,
        streak: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ error: 'Erro ao carregar usuários.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!(await checkAdminAccess())) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  try {
    const { userId, role, xp, level, streak } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'UserId obrigatório.' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role,
        xp: typeof xp === 'number' ? xp : undefined,
        level: typeof level === 'number' ? level : undefined,
        streak: typeof streak === 'number' ? streak : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        xp: true,
        level: true,
        streak: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating user stats:', error);
    return NextResponse.json({ error: 'Erro ao atualizar usuário.' }, { status: 500 });
  }
}
