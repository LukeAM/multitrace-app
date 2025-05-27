import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const { userId } = auth();

  // SSR-safe: redirect if not signed in
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <main className="p-4">
      <h1>Welcome back 👋</h1>
      <p>You’re signed in as user: {userId}</p>
    </main>
  );
}
