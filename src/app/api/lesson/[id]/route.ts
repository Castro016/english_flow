import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id } = await context.params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        exercises: true,
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lição não encontrada.' }, { status: 444 });
    }

    // Parse stringified JSON fields safely
    const formattedLesson = {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      difficulty: lesson.difficulty,
      level: lesson.level,
      introduction: lesson.introduction,
      examples: JSON.parse(lesson.examples),
      exercises: lesson.exercises.map((ex) => ({
        id: ex.id,
        type: ex.type,
        question: ex.question,
        answer: ex.answer,
        options: JSON.parse(ex.options),
      })),
    };

    return NextResponse.json({
      success: true,
      lesson: formattedLesson,
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar os dados da lição.' },
      { status: 500 }
    );
  }
}
