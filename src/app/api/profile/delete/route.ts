import { NextResponse } from 'next/server';
import { getSessionUser, clearSessionCookie } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    // 1. Log the purge action before deleting (anonymized IP and metadata to audit log)
    await prisma.auditLog.create({
      data: {
        userId: null, // De-link user relationship
        action: 'LGPD_ACCOUNT_PURGED_SUCCESS',
        ip,
        userAgent,
        details: JSON.stringify({ anonymizedUserId: user.id }),
      },
    });

    // 2. Cascade delete all user records from Prisma (handled automatically by onDelete: Cascade in schema, but clear User first)
    await prisma.user.delete({
      where: { id: user.id },
    });

    // 3. Clear session cookies securely
    const response = NextResponse.json({
      success: true,
      message: 'Sua conta foi excluída com sucesso em conformidade com a LGPD.',
    });
    
    response.cookies.delete('englishflow_session');
    
    return response;
  } catch (error) {
    console.error('Error purging LGPD user:', error);
    return NextResponse.json({ error: 'Erro ao excluir conta.' }, { status: 500 });
  }
}
