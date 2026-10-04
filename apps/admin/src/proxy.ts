import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function redirectWithinApp(request: NextRequest, pathname: string): NextResponse {
  const destination = request.nextUrl.clone();
  destination.pathname = pathname;
  destination.search = '';
  return NextResponse.redirect(destination);
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const userCookie = request.cookies.get('user')?.value;
  const { pathname } = request.nextUrl;

  let isAdmin = false;
  if (userCookie) {
    try {
      const user = JSON.parse(userCookie);
      isAdmin = user.role === 'ADMIN';
    } catch {
      isAdmin = false;
    }
  }

  if (pathname === '/login') {
    if (token && isAdmin) {
      return redirectWithinApp(request, '/');
    }
    return NextResponse.next();
  }

  if (!token || !isAdmin) {
    return redirectWithinApp(request, '/login');
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
