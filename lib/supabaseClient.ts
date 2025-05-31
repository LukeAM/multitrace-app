// lib/supabaseClient.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client without authentication
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define ProjectData interface
interface ProjectData {
  name: string;
  description?: string;
  account_id?: string;
  [key: string]: any; // For any additional fields
}

// Hook for getting Supabase client with user context
export function useClerkSupabaseAuth() {
  const { userId, isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [supabaseClient, setSupabaseClient] = useState(supabase);
  const [isReady, setIsReady] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  
  // Use refs to track sync attempts and prevent multiple simultaneous syncs
  const userSyncAttempted = useRef(false);
  const syncInProgress = useRef(false);
  const lastUserId = useRef<string | null>(null);

  // Create a stable Supabase client
  const createSupabaseClient = useCallback(() => {
    if (!isSignedIn || !userId || !user) {
      console.log('User not signed in, returning anonymous client');
      return supabase;
    }
    
    try {
      // Create a client with user context in the headers
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
          auth: {
            persistSession: true,
            storageKey: `supabase-auth-token-${userId}`,
          },
          db: {
            schema: 'public'
          }
        }
      );
      
      console.log('Created Supabase client with user context:', userId);
      return client;
    } catch (error) {
      console.error('Error creating Supabase client:', error);
      setLastError(error instanceof Error ? error : new Error(String(error)));
      return supabase;
    }
  }, [isSignedIn, userId, user]);

  useEffect(() => {
    // Don't proceed until Clerk auth is loaded
    if (!isLoaded) return;

    // If not signed in, reset state and return the anonymous client
    if (!isSignedIn || !userId || !user) {
      console.log('User not signed in, using anonymous Supabase client');
      setIsReady(false);
      setSupabaseClient(supabase);
      userSyncAttempted.current = false;
      syncInProgress.current = false;
      lastUserId.current = null;
      return;
    }

    // If user changed, reset sync attempts
    if (lastUserId.current !== userId) {
      console.log('User changed, resetting sync state');
      userSyncAttempted.current = false;
      syncInProgress.current = false;
      lastUserId.current = userId;
    }

    const initializeClient = async () => {
      try {
        const client = createSupabaseClient();
        console.log('Debug - Clerk User ID format:', userId);
        console.log('Debug - Clerk Email:', user.emailAddresses[0]?.emailAddress || 'none');
        
        // Only attempt user sync once per user session and not if already in progress
        if (!userSyncAttempted.current && !syncInProgress.current) {
          console.log('Attempting to sync user to Supabase...');
          userSyncAttempted.current = true;
          syncInProgress.current = true;
          
          try {
            const syncResult = await syncCurrentUser(client, user);
            if (!syncResult.success) {
              console.warn('User sync failed, but continuing with app:', syncResult.error);
              // Don't block the app - user might still be able to use it with demo data
              // Reset sync attempt flag so it can be retried later if needed
              userSyncAttempted.current = false;
            } else {
              console.log('User sync successful');
            }
          } catch (syncError) {
            console.error('User sync exception:', syncError);
            userSyncAttempted.current = false;
          } finally {
            syncInProgress.current = false;
          }
        }
        
        // Test query to check RLS policy effectiveness
        try {
          const { data, error } = await client
            .from('projects')
            .select('id, name')
            .limit(1);
            
          if (error) {
            console.log('Auth test query failed (expected with RLS):', error.message);
          } else {
            console.log('Auth test query succeeded:', data);
          }
        } catch (e) {
          console.log('Test query exception (expected):', e);
        }
        
        setSupabaseClient(client);
        setIsReady(true);
        setLastError(null);
      } catch (error) {
        console.error('Error in initializeClient:', error);
        setLastError(error instanceof Error ? error : new Error(String(error)));
        setIsReady(false);
      }
    };

    initializeClient();
  }, [isLoaded, isSignedIn, userId, user, createSupabaseClient]);

  // Project creation function
  const createProject = async (projectData: ProjectData) => {
    if (!userId) return { error: { message: 'User not authenticated' } };
    
    try {
      return await supabaseClient
        .from('projects')
        .insert({
          ...projectData,
          owner_id: userId,
          team_id: `team-${userId}`
        });
    } catch (error) {
      console.error('Error creating project:', error);
      return { error: { message: String(error) } };
    }
  };

  return { 
    client: supabaseClient, 
    isReady,
    createProject,
    lastError
  };
}