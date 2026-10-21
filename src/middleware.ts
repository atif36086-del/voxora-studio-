import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'voxora_auth_token';
const AUTH_COOKIE_VALUE = 'voxora_authenticated_8369';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public static assets and system routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.') || // static files like favicon.ico, images, manifest
    pathname === '/favicon.ico' ||
    pathname === '/site.webmanifest'
  ) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = authToken === AUTH_COOKIE_VALUE;

  // 2. If trying to access login page
  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 3. If accessing any other route without valid PIN cookie
  if (!isAuthenticated) {
    // If it's an API route, return 401 Unauthorized
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Unauthorized: Security PIN required.' },
        { status: 401 }
      );
    }

    // If it's a page, redirect to PIN login screen
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
