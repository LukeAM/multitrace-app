// app/page.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in'); // or '/sign-in?redirect_url=/'
  }

  redirect('/client-page'); // or render <ClientPage /> if you prefer
}
