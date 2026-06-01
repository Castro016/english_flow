import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true, message: 'Desconectado com sucesso.' });
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json({ error: 'Erro ao desconectar.' }, { status: 500 });
  }
}
