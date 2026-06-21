import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('seller-token')?.value;
  const { pathname } = request.nextUrl;
  const isLogin = pathname === '/login';

  if (!token && !isLogin) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (token && isLogin) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-|sw.js|workbox-).*)'],
};
