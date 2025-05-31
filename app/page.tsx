// app/page.tsx
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import ClientPage from './client-page'; // Adjust path if needed
import Link from 'next/link';

export default async function HomePage() {
  try {
    // Check authentication status with more detailed logging
    const { userId } = auth();

    if (!userId) {
      console.log("User not authenticated, redirecting to sign-in");
      return redirect('/sign-in');
    }
    
    // Get full user information with timeout handling
    let user;
    try {
      user = await currentUser();
    } catch (userError) {
      console.error("Error fetching user data:", userError);
      // If we can't get user data but have userId, still try to load the app
      // The client-side will handle user sync
      return <ClientPage />;
    }
    
    if (!user) {
      console.log("User data not available but userId exists, proceeding to app");
      // Don't redirect immediately - let the client-side handle it
      // This prevents loops when user exists in Clerk but data isn't immediately available
      return <ClientPage />;
    }

    console.log("User authenticated successfully:", user.id);
    // User is authenticated, render the client page
    return <ClientPage />;
  } catch (error) {
    console.error("Error in HomePage:", error);
    // Don't redirect on error - show the error instead to prevent loops
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="max-w-md rounded-lg bg-red-50 p-6 text-center">
          <h2 className="mb-2 text-xl font-bold text-red-700">Authentication Error</h2>
          <p className="mb-4 text-red-600">There was an error loading your account. Please try refreshing the page.</p>
          <pre className="mt-4 overflow-auto rounded bg-red-100 p-2 text-left text-xs text-red-800">
            {error instanceof Error ? error.message : String(error)}
          </pre>
          <div className="mt-4 flex gap-2 justify-center">
            <Link 
              href="/"
              className="inline-block rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Refresh Page
            </Link>
            <Link 
              href="/sign-in"
              className="inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Sign In Again
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
