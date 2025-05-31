// app/page.tsx
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import ClientPage from './client-page'; // Adjust path if needed

export default async function HomePage() {
  try {
    // Check authentication status
    const { userId } = auth();
    
    if (!userId) {
      console.log("User not authenticated, redirecting to sign-in");
      return redirect('/sign-in');
    }
    
    // Get full user information
    const user = await currentUser();
    
    if (!user) {
      console.log("User data not available, redirecting to sign-in");
      return redirect('/sign-in');
    }

    // User is authenticated, render the client page
    return <ClientPage />;
  } catch (error) {
    console.error("Error in HomePage:", error);
    return redirect('/sign-in');
  }
}
