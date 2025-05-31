// lib/supabaseClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth, useSession } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client without authentication for direct access
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Hook for getting an authenticated Supabase client
export function useClerkSupabaseAuth() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { session: clerkSession } = useSession();
  const [client, setClient] = useState(supabase);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Don't proceed if Clerk auth is not loaded yet
    if (!isLoaded) return;

    // Create a new supabase client for this session
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function setupSupabaseAuth() {
      try {
        if (isSignedIn && clerkSession) {
          // Get JWT token from Clerk with Supabase template
          console.log('Getting Supabase token from Clerk...');
          const token = await getToken({ template: 'supabase' });
          
          if (!token) {
            console.error('Failed to get Supabase token from Clerk');
            return;
          }
          
          console.log('Setting Supabase session with Clerk token...');
          // Set the Supabase session with the token from Clerk
          const { data, error } = await supabaseClient.auth.setSession({
            access_token: token,
            refresh_token: '',  // Not needed with Clerk
          });
          
          if (error) {
            console.error('Error setting Supabase session:', error.message);
            return;
          }
          
          console.log('Supabase session set successfully');
          // Check if user is actually authenticated
          const { data: userData, error: userError } = await supabaseClient.auth.getUser();
          
          if (userError) {
            console.error('Failed to get user from Supabase:', userError.message);
            return;
          }
          
          if (userData?.user) {
            console.log('Supabase user authenticated:', userData.user.id);
            setClient(supabaseClient);
            setIsAuthReady(true);
          } else {
            console.error('No user found in Supabase response');
          }
        } else {
          console.log('User not signed in with Clerk');
          await supabaseClient.auth.signOut();
        }
      } catch (error) {
        console.error('Error in setupSupabaseAuth:', error);
      }
    }

    setupSupabaseAuth();
    
    // Set up interval to refresh the token
    const refreshInterval = setInterval(() => {
      if (isSignedIn && clerkSession) {
        setupSupabaseAuth();
      }
    }, 5 * 60 * 1000); // Refresh every 5 minutes
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [isLoaded, isSignedIn, clerkSession, getToken]);

  return isAuthReady ? client : null;
}