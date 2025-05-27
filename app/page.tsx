import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import ClientPage from './client-page';

export default async function Page() {
  const session = await auth();
  const userId = session?.userId;

  if (!userId) {
    redirect('/sign-in');
  }

  return <ClientPage />;
}