import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createBrowserClient } from '@supabase/ssr';

// These are required: the `supabaseUrl` and `supabaseKey`
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

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