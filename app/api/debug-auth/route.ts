import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { ensureUserExists } from '@/lib/userSync';

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
    let userCreationTest = null;
    
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
        
        // Test 1: Check if user exists
        console.log('Testing user existence...');
        const { data: dbUser, error } = await supabase
          .from('users')
          .select('id, email, created_at')
          .eq('id', userId)
          .single();
          
        if (error) {
          supabaseError = error.message;
          console.log('User does not exist, error:', error);
        } else if (dbUser) {
          supabaseUserExists = true;
          console.log('User exists:', dbUser);
        }
        
        // Test 2: Try to create user if they don't exist and we have user data
        if (!supabaseUserExists && user) {
          console.log('Attempting to create user...');
          try {
            const creationResult = await ensureUserExists(supabase, {
              id: userId,
              email: user.emailAddresses[0]?.emailAddress || '',
              firstName: user.firstName || '',
              lastName: user.lastName || ''
            });
            
            userCreationTest = {
              attempted: true,
              success: creationResult.success,
              error: creationResult.error || null
            };
            
            if (creationResult.success) {
              console.log('User creation successful!');
              supabaseUserExists = true;
            } else {
              console.log('User creation failed:', creationResult.error);
            }
          } catch (createError) {
            const errorMsg = createError instanceof Error ? createError.message : String(createError);
            userCreationTest = {
              attempted: true,
              success: false,
              error: errorMsg
            };
            console.error('User creation exception:', createError);
          }
        }
        
        // Test 3: Check table structure
        console.log('Checking users table structure...');
        const { data: tableInfo, error: tableError } = await supabase
          .from('users')
          .select('*')
          .limit(1);
          
        console.log('Table query result:', { data: tableInfo, error: tableError });
        
      } catch (err) {
        supabaseError = err instanceof Error ? err.message : String(err);
        console.error('Supabase connection error:', err);
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
        userCreatedAt: user?.createdAt || null,
        userFirstName: user?.firstName || null,
        userLastName: user?.lastName || null
      },
      supabase: {
        userExists: supabaseUserExists,
        error: supabaseError,
        userCreationTest
      },
      environment: {
        hasClerkPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY,
        hasClerkWebhookSecret: !!process.env.CLERK_WEBHOOK_SECRET,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      }
    };
    
    console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
    
    return NextResponse.json(debugInfo);
    
  } catch (error: any) {
    console.error('Debug auth route error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
        stack: error.stack
      },
      { status: 500 }
    );
  }
} 