import { authMiddleware } from '@clerk/nextjs/server';

// This middleware protects routes that require authentication
export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: ['/sign-in', '/sign-up', '/api/hello', '/api/test-auth', '/api/debug-auth', '/api/webhooks/clerk'],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
