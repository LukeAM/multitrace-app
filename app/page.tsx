// app/page.tsx
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import ClientPage from './client-page'; // Adjust path if needed
import Link from 'next/link';

export default async function HomePage() {
  try {
    console.log('=== HomePage called ===');
    
    // Check authentication status with more detailed logging
    const { userId } = auth();
    console.log('Auth check result - userId:', userId);

    if (!userId) {
      console.log("No userId found, redirecting to sign-in");
      return redirect('/sign-in');
    }
    
    // For existing users, be more lenient about loading the app
    // The client-side will handle the full authentication flow
    console.log("User has userId, attempting to load app");
    
    // Try to get user data, but don't block the app if it fails
    let user = null;
    try {
      user = await currentUser();
      console.log("Current user loaded successfully:", user?.id);
    } catch (userError) {
      console.warn("Error fetching user data (non-blocking):", userError);
      // Continue to load the app - the client-side will handle user sync
    }
    
    // Always load the app if we have a userId
    // The client-side authentication and user sync will handle the rest
    console.log("Loading ClientPage for user:", userId);
    return <ClientPage />;
    
  } catch (error) {
    console.error("Critical error in HomePage:", error);
    
    // Show a more helpful error page with debug link
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="max-w-md rounded-lg bg-red-50 p-6 text-center">
          <h2 className="mb-2 text-xl font-bold text-red-700">Authentication Error</h2>
          <p className="mb-4 text-red-600">
            There was an error loading your account. This might be a temporary issue.
          </p>
          <pre className="mt-4 overflow-auto rounded bg-red-100 p-2 text-left text-xs text-red-800 max-h-40">
            {error instanceof Error ? error.message : String(error)}
          </pre>
          <div className="mt-6 flex flex-col gap-3">
            <Link 
              href="/debug-auth-page"
              className="inline-block rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
            >
              🔍 Debug Authentication
            </Link>
            <div className="flex gap-2 justify-center">
              <Link 
                href="/"
                className="inline-block rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Try Again
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
      </div>
    );
  }
}
