import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

// This route will help us debug auth issues with Supabase
export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Create Supabase client with custom headers
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            'x-clerk-user-id': userId,
          },
        },
      }
    );

    // Try to query projects table
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')
      .limit(5);

    // Try to query accounts table
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name')
      .limit(5);

    return NextResponse.json({
      clerkUserId: userId,
      projects: {
        data: projects,
        error: projectsError ? projectsError.message : null
      },
      accounts: {
        data: accounts,
        error: accountsError ? accountsError.message : null
      }
    });
  } catch (error: any) {
    console.error('Auth test error:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 