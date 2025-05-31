// lib/supabaseClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client without authentication for direct access
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Hook for getting an authenticated Supabase client
export function useClerkSupabaseAuth() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [client, setClient] = useState(supabase);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Create a new client for each session to avoid shared state issues
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const setSupabaseAuth = async () => {
      try {
        // Only proceed if Clerk auth is fully loaded
        if (!isLoaded) return;

        if (isSignedIn) {
          console.log('Clerk auth: User is signed in, getting token for Supabase');
          const token = await getToken({ template: 'supabase' });
          
          if (token) {
            console.log('Clerk token received, setting Supabase session');
            const { error } = await supabaseClient.auth.setSession({
              access_token: token,
              refresh_token: '',
            });
            
            if (error) {
              console.error('Error setting Supabase session:', error);
            } else {
              console.log('Supabase session set successfully');
              setClient(supabaseClient);
            }
          } else {
            console.error('Failed to get token from Clerk');
          }
        } else if (isLoaded) {
          console.log('User not signed in or Clerk auth not loaded yet');
          await supabaseClient.auth.signOut();
        }
        
        setIsAuthReady(true);
      } catch (error) {
        console.error('Error setting up Supabase auth:', error);
      }
    };

    setSupabaseAuth();
    
    // Refresh token periodically
    const refreshInterval = setInterval(() => {
      if (isSignedIn && isLoaded) {
        setSupabaseAuth();
      }
    }, 10 * 60 * 1000); // Refresh every 10 minutes
    
    return () => clearInterval(refreshInterval);
  }, [getToken, isSignedIn, isLoaded]);

  return client;
}