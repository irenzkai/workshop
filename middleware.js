import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || '7a98150ac6ccd1cd6154c1ad80ba5279446d01d9164e6cb95cd7a0b59af424a4'
);

export async function middleware(request) {
  const session = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  // Redirect authenticated users away from auth pages
  if (session && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
    try {
      await jwtVerify(session, JWT_SECRET);
      return NextResponse.redirect(new URL('/todos', request.url));
    } catch (err) {
      // Invalid token, allow access to landing/auth pages
    }
  }

  // Protect /todos routes
  if (pathname.startsWith('/todos')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    try {
      await jwtVerify(session, JWT_SECRET);
    } catch (err) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/register', '/todos/:path*'],
};