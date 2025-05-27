// lib/supabaseClient.ts
import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

export const supabase = createPagesBrowserClient();

export function useClerkSupabaseAuth() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    const setSupabaseAuth = async () => {
      if (isSignedIn) {
        const token = await getToken({ template: 'supabase' });
        if (token) {
          await supabase.auth.setSession({
            access_token: token,
            refresh_token: '', // Required param, but not used
          });
        }
      } else {
        await supabase.auth.signOut();
      }
    };

    setSupabaseAuth();
  }, [getToken, isSignedIn]);

  return supabase;
}