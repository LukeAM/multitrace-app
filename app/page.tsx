import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import ClientPage from "./client-page";

export default async function Page() {
  const { userId } = auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  return <ClientPage />;
}
