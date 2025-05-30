// app/page.tsx
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import ClientPage from './client-page'; // Adjust path if needed

export default async function HomePage() {
  // Check authentication status
  const { userId } = auth();
  const user = await currentUser();

  // If not authenticated, redirect to sign-in
  if (!userId || !user) {
    console.log("User not authenticated, redirecting to sign-in");
    redirect('/sign-in');
  }

  return <ClientPage />;
}
