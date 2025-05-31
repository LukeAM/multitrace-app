import { authMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware protects routes that require authentication
export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    '/sign-in',
    '/sign-up',
    '/',  // Allow homepage without auth for marketing
    '/api/webhook(.*)', // Allow webhooks to bypass auth
    '/favicon.ico',
    '/public/.*',
  ],
  // Routes that can always be accessed, even if not public or authenticated
  ignoredRoutes: [
    '/_next/static/(.*)',
    '/_next/image(.*)',
    '/assets/(.*)',
    '/api/clerk-webhook(.*)',
  ],
  // Function to handle what happens after a user is authenticated
  afterAuth(auth, req, evt) {
    // Handle authenticated requests
    if (auth.isPublicRoute) {
      // Don't do anything for public routes
      return NextResponse.next();
    }

    // If user is not authenticated and trying to access a protected route
    if (!auth.userId && !auth.isPublicRoute) {
      // Redirect to sign-in page
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }

    // Allow authenticated requests to proceed
    return NextResponse.next();
  },
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
