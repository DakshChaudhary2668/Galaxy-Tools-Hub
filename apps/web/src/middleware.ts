import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow all static assets, Next.js internal files, and public routes
  const { pathname } = request.nextUrl;

  // Add request path header for downstream server components if needed
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-url-path', pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
};
