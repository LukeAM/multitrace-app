// lib/supabaseClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client without authentication
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Hook for getting Supabase client with user context
export function useClerkSupabaseAuth() {
  const { userId, isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [supabaseClient, setSupabaseClient] = useState(supabase);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Don't proceed until Clerk auth is loaded
    if (!isLoaded) return;

    // If not signed in, return the anonymous client
    if (!isSignedIn || !userId || !user) {
      console.log('User not signed in, using anonymous Supabase client');
      setIsReady(false);
      return;
    }

    // Create a client with user context in the headers
    // This doesn't try to set a session, but passes user info with each request
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            'x-clerk-user-id': userId,
            'x-user-email': user.emailAddresses[0]?.emailAddress || '',
          },
        },
      }
    );

    console.log('Created Supabase client with user context:', userId);
    console.log('Debug - Clerk User ID format:', userId);
    console.log('Debug - Clerk Email:', user.emailAddresses[0]?.emailAddress || 'none');
    
    // Test query to check RLS policy effectiveness
    async function testQuery() {
      try {
        const { data, error } = await client
          .from('projects')
          .select('id, name')
          .limit(1);
          
        if (error) {
          console.error('Auth test query failed:', error.message);
          console.error('Detailed error:', error);
        } else {
          console.log('Auth test query succeeded:', data);
        }
      } catch (e) {
        console.error('Test query exception:', e);
      }
    }
    
    testQuery();
    
    setSupabaseClient(client);
    setIsReady(true);
  }, [isLoaded, isSignedIn, userId, user]);

  return { client: supabaseClient, isReady };
}

// Example of how project creation should work
const createProject = async (projectData) => {
  const { data, error } = await supabaseClient
    .from('projects')
    .insert({
      ...projectData,
      owner_id: userId, // Clerk user ID
      team_id: `team-${userId}` // The auto-created team
    });
};