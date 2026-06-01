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

export async function GET(req: Request) {
  if (!(await checkAdminAccess())) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get('lessonId');

  if (!lessonId) {
    return NextResponse.json({ error: 'LessonId obrigatório.' }, { status: 400 });
  }

  try {
    const exercises = await prisma.exercise.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'asc' },
    });

    // Parse options for Choice or Drag
    const parsedExercises = exercises.map((ex) => ({
      ...ex,
      options: JSON.parse(ex.options),
    }));

    return NextResponse.json({ success: true, exercises: parsedExercises });
  } catch (error) {
    console.error('Error fetching admin exercises:', error);
    return NextResponse.json({ error: 'Erro ao carregar exercícios.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await checkAdminAccess())) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  try {
    const { lessonId, type, question, answer, options } = await req.json();

    if (!lessonId || !type || !question || !answer) {
      return NextResponse.json({ error: 'Preencha os campos obrigatórios.' }, { status: 400 });
    }

    const exercise = await prisma.exercise.create({
      data: {
        lessonId,
        type,
        question,
        answer,
        options: typeof options === 'string' ? options : JSON.stringify(options || []),
      },
    });

    return NextResponse.json({ success: true, exercise });
  } catch (error) {
    console.error('Error creating exercise:', error);
    return NextResponse.json({ error: 'Erro ao criar exercício.' }, { status: 500 });
  }
}
