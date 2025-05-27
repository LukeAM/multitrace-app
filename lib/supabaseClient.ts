import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(); // ✅ this line is required

export function useClerkSupabaseAuth() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    const setSupabaseAuth = async () => {
      if (isSignedIn) {
        const token = await getToken({ template: 'supabase' });
        if (token) {
          await supabase.auth.setSession({
            access_token: token,
            refresh_token: '',
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