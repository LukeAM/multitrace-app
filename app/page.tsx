// app/page.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import ClientPage from './client-page'; // Adjust path if needed

export default async function HomePage() {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in'); // or '/sign-in?redirect_url=/'
  }

  return <ClientPage />;
}
