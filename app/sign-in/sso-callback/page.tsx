import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SSOCallbackPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/");
  }

  // If Clerk hasn't populated the session yet
  return (
    <html>
      <body>
        <script dangerouslySetInnerHTML={{
          __html: `
            setTimeout(() => {
              window.location.href = "/";
            }, 2000);
          `
        }} />
        <p style={{ fontFamily: "sans-serif", padding: "2rem" }}>
          Signing you in...
        </p>
      </body>
    </html>
  );
}
