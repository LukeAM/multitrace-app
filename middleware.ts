import { authMiddleware } from '@clerk/nextjs/server';

// This middleware protects routes that require authentication
export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: ['/sign-in', '/sign-up', '/api/hello', '/api/test-auth', '/api/debug-auth', '/api/debug-auth-state', '/api/sync-session', '/api/test-user-creation', '/api/test-webhook', '/api/fix-existing-users', '/api/webhooks/clerk'],
  
  // Enable debug mode to see what's happening
  debug: process.env.NODE_ENV === 'development',
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
