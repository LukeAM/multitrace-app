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
    // Don't redirect on error - show the error instead
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="max-w-md rounded-lg bg-red-50 p-6 text-center">
          <h2 className="mb-2 text-xl font-bold text-red-700">Authentication Error</h2>
          <p className="mb-4 text-red-600">There was an error loading your account. Please try refreshing the page.</p>
          <pre className="mt-4 overflow-auto rounded bg-red-100 p-2 text-left text-xs text-red-800">
            {error instanceof Error ? error.message : String(error)}
          </pre>
          <a 
            href="/"
            className="mt-4 inline-block rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Refresh Page
          </a>
        </div>
      </div>
    );
  }
}
