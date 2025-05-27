import { authMiddleware } from "@clerk/nextjs";
// copmment
export default authMiddleware({
  publicRoutes: ["/sign-in", "/sign-up", "/sso-callback", "/debug-supabase", "/favicon.ico"],
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};