import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log('=== Debug Auth Route Called ===');
    
    // Check Clerk auth state
    const { userId, sessionId } = auth();
    console.log('Clerk userId:', userId);
    console.log('Clerk sessionId:', sessionId);
    
    let user = null;
    let userError = null;
    try {
      user = await currentUser();
    } catch (err) {
      userError = err instanceof Error ? err.message : String(err);
      console.error('Error fetching currentUser:', userError);
    }
    
    // Check if user exists in Supabase
    let supabaseUserExists = false;
    let supabaseError = null;
    
    if (userId) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for debugging
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        );
        
        const { data: dbUser, error } = await supabase
          .from('users')
          .select('id, email, created_at')
          .eq('id', userId)
          .single();
          
        if (error) {
          supabaseError = error.message;
        } else if (dbUser) {
          supabaseUserExists = true;
        }
        
      } catch (err) {
        supabaseError = err instanceof Error ? err.message : String(err);
      }
    }
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      clerk: {
        userId,
        sessionId,
        userExists: !!user,
        userError,
        userEmail: user?.emailAddresses?.[0]?.emailAddress || null,
        userCreatedAt: user?.createdAt || null
      },
      supabase: {
        userExists: supabaseUserExists,
        error: supabaseError
      },
      environment: {
        hasClerkPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    };
    
    console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
    
    return NextResponse.json(debugInfo);
    
  } catch (error: any) {
    console.error('Debug auth route error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 