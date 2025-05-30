// lib/supabaseClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

// Create the Supabase client
const supabaseClient = createPagesBrowserClient();

export const supabase = supabaseClient;

export function useClerkSupabaseAuth() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const setSupabaseAuth = async () => {
      try {
        // Only proceed if Clerk auth is fully loaded
        if (!isLoaded) return;

        if (isSignedIn) {
          console.log('Clerk auth: User is signed in, getting token for Supabase');
          const token = await getToken({ template: 'supabase' });
          
          if (token) {
            console.log('Clerk token received, setting Supabase session');
            await supabaseClient.auth.setSession({
              access_token: token,
              refresh_token: '', // not needed with Clerk
            });
            console.log('Supabase session set successfully');
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
  }, [getToken, isSignedIn, isLoaded]);

  return supabaseClient;
}