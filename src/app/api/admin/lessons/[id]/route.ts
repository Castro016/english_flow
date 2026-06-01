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

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdminAccess())) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const { title, description, difficulty, level, introduction, examples } = await req.json();

    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
        title,
        description,
        difficulty,
        level,
        introduction,
        examples: typeof examples === 'string' ? examples : JSON.stringify(examples || []),
      },
    });

    return NextResponse.json({ success: true, lesson });
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json({ error: 'Erro ao editar lição.' }, { status: 500 });
  }
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

    await prisma.lesson.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Lição excluída com sucesso.' });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json({ error: 'Erro ao excluir lição.' }, { status: 500 });
  }
}
