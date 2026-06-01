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

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdminAccess())) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  try {
    const { id } = await context.params;

    await prisma.exercise.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Exercício excluído com sucesso.' });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    return NextResponse.json({ error: 'Erro ao excluir exercício.' }, { status: 500 });
  }
}
