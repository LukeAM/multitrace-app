import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SSOCallbackPage() {
  // This triggers the session to be validated, and redirects home
  const { userId } = auth();

  if (userId) {
    redirect("/");
  }

  // Optionally render a loading state
  return <p>Signing you in...</p>;
}
