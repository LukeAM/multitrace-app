import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

export const supabase = createPagesBrowserClient();

export function useClerkSupabaseAuth() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    const setSupabaseAuth = async () => {
      if (isSignedIn) {
        const token = await getToken({ template: 'supabase' }); // 👈 THIS MUST MATCH YOUR Clerk JWT template name
        if (token) {
          await supabase.auth.setSession({
            access_token: token,
            refresh_token: '', // Not needed for Clerk
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
