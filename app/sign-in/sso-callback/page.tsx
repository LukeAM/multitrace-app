import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SSOCallbackPage() {
  try {
    const { userId } = await auth();

    if (userId) {
      // User is authenticated, redirect to home
      redirect("/");
    }

    // If we get here, user is not authenticated yet
    // Return a more robust waiting page with better error handling
    return (
      <html>
        <head>
          <title>Signing you in...</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body>
          <script dangerouslySetInnerHTML={{
            __html: `
              let retryCount = 0;
              const maxRetries = 5;
              
              function checkAuthAndRedirect() {
                retryCount++;
                
                // Check if we've exceeded max retries
                if (retryCount > maxRetries) {
                  console.log("Authentication timeout, redirecting to sign-in");
                  window.location.href = "/sign-in";
                  return;
                }
                
                // Try to redirect to home page
                // If user is still not authenticated, they'll be redirected back to sign-in
                window.location.href = "/";
              }
              
              // Initial redirect attempt after 1 second
              setTimeout(checkAuthAndRedirect, 1000);
            `
          }} />
          <div style={{ 
            fontFamily: "sans-serif", 
            padding: "2rem", 
            textAlign: "center",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center"
          }}>
            <h2>Signing you in...</h2>
            <p style={{ color: "#666", marginTop: "1rem" }}>
              Please wait while we complete your authentication.
            </p>
            <div style={{ 
              marginTop: "2rem",
              padding: "1rem",
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
              fontSize: "0.9em",
              color: "#666"
            }}>
              If this takes longer than expected, you will be redirected automatically.
            </div>
          </div>
        </body>
      </html>
    );
  } catch (error) {
    console.error("Error in SSO callback:", error);
    
    // On error, redirect to sign-in page
    return (
      <html>
        <head>
          <title>Authentication Error</title>
        </head>
        <body>
          <script dangerouslySetInnerHTML={{
            __html: `
              console.error("SSO callback error, redirecting to sign-in");
              window.location.href = "/sign-in";
            `
          }} />
          <div style={{ 
            fontFamily: "sans-serif", 
            padding: "2rem", 
            textAlign: "center",
            color: "#d32f2f"
          }}>
            <h2>Authentication Error</h2>
            <p>Redirecting you to sign in...</p>
          </div>
        </body>
      </html>
    );
  }
}
