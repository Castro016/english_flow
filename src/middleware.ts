import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const roleHierarchy: Record<string, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  MODERATOR: 2,
  USER: 1,
};

function hasRole(userRole: string, requiredRole: string): boolean {
  const userWeight = roleHierarchy[userRole] || 0;
  const requiredWeight = roleHierarchy[requiredRole] || 0;
  return userWeight >= requiredWeight;
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('englishflow_session')?.value;
  const { pathname } = request.nextUrl;

  // 1. Path Traversal Shield
  const decodedPathname = decodeURIComponent(pathname);
  if (
    pathname.includes('..') ||
    decodedPathname.includes('..') ||
    pathname.includes('%2e%2e') ||
    decodedPathname.includes('%2e%2e')
  ) {
    const errorResponse = new NextResponse('Bad Request: Path Traversal Attempt Blocked', { status: 400 });
    return addSecurityHeaders(errorResponse);
  }

  const isProtectedPath =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/lesson') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/admin');

  const isAuthPath = pathname.startsWith('/login') || pathname.startsWith('/register');

  if (!token) {
    if (isProtectedPath) {
      const url = new URL('/login', request.url);
      return addSecurityHeaders(NextResponse.redirect(url));
    }
    return addSecurityHeaders(NextResponse.next());
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    // Base64URL decode standard function
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);

    // Check expiry
    const isExpired = payload.exp ? Date.now() >= payload.exp * 1000 : false;
    if (isExpired) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('englishflow_session');
      return addSecurityHeaders(response);
    }

    if (isAuthPath) {
      return addSecurityHeaders(NextResponse.redirect(new URL('/dashboard', request.url)));
    }

    if (pathname.startsWith('/admin') && !hasRole(payload.role || 'USER', 'ADMIN')) {
      return addSecurityHeaders(NextResponse.redirect(new URL('/dashboard', request.url)));
    }
  } catch (error) {
    if (isProtectedPath) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('englishflow_session');
      return addSecurityHeaders(response);
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/dashboard/:path*', '/lesson/:path*', '/profile/:path*', '/admin/:path*', '/login', '/register'],
};
