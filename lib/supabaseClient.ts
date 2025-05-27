// lib/supabaseClient.ts

import { createBrowserClient } from '@supabase/ssr';
import { useMemo } from 'react';
import { useSession } from '@clerk/nextjs';

export function useClerkSupabaseAuth() {
  const { session } = useSession();

  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: session?.id ? `Bearer ${session.id}` : '',
          },
        },
      }
    );
  }, [session]);

  return supabase;
}