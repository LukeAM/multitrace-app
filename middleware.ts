import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Protect everything except Clerk public routes
    "/((?!.+\\.[\\w]+$|_next|sign-in|sign-up|sso-callback|api/webhooks|favicon.ico).*)",
  ],
};
