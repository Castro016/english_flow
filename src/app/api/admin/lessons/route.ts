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
    const lessons = await prisma.lesson.findMany({
      include: {
        _count: {
          select: { exercises: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, lessons });
  } catch (error) {
    console.error('Error fetching admin lessons:', error);
    return NextResponse.json({ error: 'Erro ao carregar lições.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await checkAdminAccess())) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  try {
    const { title, description, difficulty, level, introduction, examples } = await req.json();

    if (!title || !description || !introduction) {
      return NextResponse.json({ error: 'Preencha os campos obrigatórios.' }, { status: 400 });
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        description,
        difficulty: difficulty || 'EASY',
        level: level || 'A1',
        introduction,
        examples: typeof examples === 'string' ? examples : JSON.stringify(examples || []),
      },
    });

    return NextResponse.json({ success: true, lesson });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json({ error: 'Erro ao criar lição.' }, { status: 500 });
  }
}
