import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isProtectedRoute = createRouteMatcher(['/checkout(.*)', '/cart']);

function isValidClerkPublishableKey(key?: string): boolean {
  if (!key || typeof key !== 'string') return false;
  if (!key.startsWith('pk_test_') && !key.startsWith('pk_live_')) return false;
  const parts = key.split('_');
  if (parts.length !== 3 || !parts[2]) return false;
  try {
    const decoded = atob(parts[2]);
    return decoded.endsWith('$') && decoded.includes('.');
  } catch {
    return false;
  }
}

const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const secretKey = process.env.CLERK_SECRET_KEY;
const hasValidClerkKeys = isValidClerkPublishableKey(pubKey) && Boolean(secretKey);

export default hasValidClerkKeys
  ? clerkMiddleware(async (auth, req) => {
      if (isAdminRoute(req) || isProtectedRoute(req)) {
        await auth().protect();
      }
    })
  : () => NextResponse.next();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
