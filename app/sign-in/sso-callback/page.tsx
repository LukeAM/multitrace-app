import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SSOCallbackPage() {
  const { userId } = await auth(); // ✅ await here

  if (userId) {
    redirect("/");
  }

  return <p>Signing you in...</p>;
}
