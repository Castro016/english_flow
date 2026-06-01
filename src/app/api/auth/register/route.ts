import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signToken, setSessionCookie } from '@/lib/auth';
import { hashPassword } from '@/lib/security/hash';
import { escapeHtml, validateEmail, validatePasswordStrength } from '@/lib/security/xss';

export async function POST(req: Request) {
  try {
    const { name, email, password, avatar } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, e-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const safeName = escapeHtml(name.trim());
    const safeEmail = email.trim().toLowerCase();

    if (!validateEmail(safeEmail)) {
      return NextResponse.json(
        { error: 'Formato de e-mail inválido.' },
        { status: 400 }
      );
    }

    if (!validatePasswordStrength(password)) {
      return NextResponse.json(
        { error: 'A senha deve conter no mínimo 8 caracteres, incluindo uma letra maiúscula, uma minúscula, um número e um caractere especial.' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: safeEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este e-mail já está em uso.' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: safeName,
        email: safeEmail,
        password: hashedPassword,
        avatar: avatar || 'avatar_1',
        xp: 0,
        level: 1,
        streak: 0,
        role: 'USER',
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await setSessionCookie(token);

    // Get client metadata for audit logging
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'AUTH_REGISTER_SUCCESS',
        ip,
        userAgent,
        details: JSON.stringify({ email: user.email }),
      },
    });

    // Omit sensitive password fields from response
    const { password: _, mfaSecret: __, ...userWithoutPassword } = user;

    return NextResponse.json(
      { success: true, user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error during registration API:', error);
    return NextResponse.json(
      { error: 'Ocorreu um erro interno no servidor.' },
      { status: 500 }
    );
  }
}
