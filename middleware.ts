import { authMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default authMiddleware({
  publicRoutes: ["/debug-supabase", "/sign-in", "/favicon.ico"],
  afterAuth(auth, req) {
    console.log("[middleware] Running for:", req.nextUrl.pathname);
    return NextResponse.next();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
