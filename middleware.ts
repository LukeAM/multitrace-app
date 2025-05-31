import { authMiddleware } from '@clerk/nextjs/server';

// This middleware protects routes that require authentication
export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: ['/sign-in', '/sign-up', '/api/hello', '/api/test-auth'],
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)',],
};
