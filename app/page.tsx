import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import ClientPage from "./client-page";

export default async function Page() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  return <ClientPage />;
}
