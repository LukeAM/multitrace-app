// app/sign-in/sso-callback/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic"; // Optional: ensures SSR in Vercel edge

export default async function SSOCallbackPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/"); // send them home or wherever you want
  }

  // fallback while waiting
  return <p>Signing you in...</p>;
}
