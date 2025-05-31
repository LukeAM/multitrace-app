"use client";

import { useAuth, useUser } from '@clerk/nextjs';
import { useClerkSupabaseAuth } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DebugAuthPage() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const { client: supabaseClient, isReady: supabaseReady, lastError } = useClerkSupabaseAuth();
  
  const [supabaseTest, setSupabaseTest] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (isSignedIn && supabaseReady && !testing) {
      setTesting(true);
      
      const testSupabase = async () => {
        try {
          // Test 1: Try to query users table
          const { data: userData, error: userError } = await supabaseClient
            .from('users')
            .select('id, email, created_at')
            .eq('id', userId)
            .single();

          // Test 2: Try to query projects
          const { data: projects, error: projectsError } = await supabaseClient
            .from('projects')
            .select('id, name')
            .limit(3);

          // Test 3: Try to query teams
          const { data: teams, error: teamsError } = await supabaseClient
            .from('team_members')
            .select('team_id')
            .eq('user_id', userId);

          setSupabaseTest({
            userQuery: { data: userData, error: userError?.message },
            projectsQuery: { data: projects, error: projectsError?.message },
            teamsQuery: { data: teams, error: teamsError?.message }
          });
        } catch (error) {
          setSupabaseTest({ error: error instanceof Error ? error.message : String(error) });
        }
      };

      testSupabase();
    }
  }, [isSignedIn, supabaseReady, userId, supabaseClient, testing]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Authentication Debug Page</h1>
        
        <div className="grid gap-6">
          {/* Clerk Authentication Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">🔐 Clerk Authentication</h2>
            <div className="space-y-2">
              <div>
                <strong>Is Loaded:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-sm ${isLoaded ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {isLoaded ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <strong>Is Signed In:</strong>
                <span className={`ml-2 px-2 py-1 rounded text-sm ${isSignedIn ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {isSignedIn ? 'Yes' : 'No'}
                </span>
              </div>
              <div><strong>User ID:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{userId || 'null'}</code></div>
              <div><strong>Email:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{user?.emailAddresses?.[0]?.emailAddress || 'null'}</code></div>
              <div><strong>First Name:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{user?.firstName || 'null'}</code></div>
              <div><strong>Last Name:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{user?.lastName || 'null'}</code></div>
            </div>
          </div>

          {/* Supabase Connection Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-600">🗄️ Supabase Connection</h2>
            <div className="space-y-2">
              <div>
                <strong>Is Ready:</strong>
                <span className={`ml-2 px-2 py-1 rounded text-sm ${supabaseReady ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {supabaseReady ? 'Yes' : 'No'}
                </span>
              </div>
              <div><strong>Last Error:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{lastError?.message || 'None'}</code></div>
            </div>
          </div>

          {/* Supabase Data Tests */}
          {supabaseTest && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-purple-600">🧪 Supabase Data Tests</h2>
              
              {/* User Query */}
              <div className="mb-4 p-4 border rounded">
                <h3 className="font-semibold text-lg">User Exists in Supabase:</h3>
                {supabaseTest.userQuery ? (
                  <div>
                    <div>
                      <strong>Status:</strong>
                      <span className={`ml-2 px-2 py-1 rounded text-sm ${supabaseTest.userQuery.data ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {supabaseTest.userQuery.data ? 'Found' : 'Not Found'}
                      </span>
                    </div>
                    {supabaseTest.userQuery.data && (
                      <div><strong>Data:</strong> <pre className="bg-gray-100 p-2 rounded mt-2 text-sm">{JSON.stringify(supabaseTest.userQuery.data, null, 2)}</pre></div>
                    )}
                    {supabaseTest.userQuery.error && (
                      <div><strong>Error:</strong> <code className="bg-red-100 text-red-800 px-2 py-1 rounded">{supabaseTest.userQuery.error}</code></div>
                    )}
                  </div>
                ) : (
                  <div>Testing...</div>
                )}
              </div>

              {/* Projects Query */}
              <div className="mb-4 p-4 border rounded">
                <h3 className="font-semibold text-lg">Projects Access:</h3>
                {supabaseTest.projectsQuery ? (
                  <div>
                    <div>
                      <strong>Status:</strong>
                      <span className={`ml-2 px-2 py-1 rounded text-sm ${supabaseTest.projectsQuery.data ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {supabaseTest.projectsQuery.data ? 'Success' : 'Failed'}
                      </span>
                    </div>
                    {supabaseTest.projectsQuery.data && (
                      <div><strong>Projects Found:</strong> {supabaseTest.projectsQuery.data.length}</div>
                    )}
                    {supabaseTest.projectsQuery.error && (
                      <div><strong>Error:</strong> <code className="bg-red-100 text-red-800 px-2 py-1 rounded">{supabaseTest.projectsQuery.error}</code></div>
                    )}
                  </div>
                ) : (
                  <div>Testing...</div>
                )}
              </div>

              {/* Teams Query */}
              <div className="mb-4 p-4 border rounded">
                <h3 className="font-semibold text-lg">Teams Access:</h3>
                {supabaseTest.teamsQuery ? (
                  <div>
                    <div>
                      <strong>Status:</strong>
                      <span className={`ml-2 px-2 py-1 rounded text-sm ${supabaseTest.teamsQuery.data ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {supabaseTest.teamsQuery.data ? 'Success' : 'Failed'}
                      </span>
                    </div>
                    {supabaseTest.teamsQuery.data && (
                      <div><strong>Teams Found:</strong> {supabaseTest.teamsQuery.data.length}</div>
                    )}
                    {supabaseTest.teamsQuery.error && (
                      <div><strong>Error:</strong> <code className="bg-red-100 text-red-800 px-2 py-1 rounded">{supabaseTest.teamsQuery.error}</code></div>
                    )}
                  </div>
                ) : (
                  <div>Testing...</div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-orange-600">🔧 Actions</h2>
            <div className="space-y-4">
              <Link href="/" className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                Try Going Home
              </Link>
              <Link href="/sign-in" className="inline-block bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded ml-4">
                Go to Sign In
              </Link>
              <button 
                onClick={() => window.location.reload()} 
                className="inline-block bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded ml-4"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 