import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    console.log('=== Debug Auth State Route Called ===');
    
    // Get request headers to check for Clerk session info
    const headers = Object.fromEntries(req.headers.entries());
    const cookieHeader = headers.cookie || '';
    
    console.log('Request headers:', {
      userAgent: headers['user-agent'],
      hasCookies: !!cookieHeader,
      cookieCount: cookieHeader.split(';').length,
      authorizationHeader: headers.authorization ? 'present' : 'missing'
    });
    
    // Try to get auth info
    let authResult = null;
    let authError = null;
    
    try {
      const authData = auth();
      authResult = {
        userId: authData.userId,
        sessionId: authData.sessionId,
        orgId: authData.orgId
      };
      console.log('Auth result:', authResult);
    } catch (error) {
      authError = error instanceof Error ? error.message : String(error);
      console.error('Auth error:', authError);
    }
    
    // Try to get current user
    let userData = null;
    let userError = null;
    
    if (authResult?.userId) {
      try {
        const user = await currentUser();
        userData = user ? {
          id: user.id,
          email: user.emailAddresses?.[0]?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt
        } : null;
      } catch (error) {
        userError = error instanceof Error ? error.message : String(error);
        console.error('User fetch error:', userError);
      }
    }
    
    // Test Supabase connection with service role
    let supabaseTest = null;
    let supabaseError = null;
    
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
        
      if (error) {
        supabaseError = error.message;
      } else {
        supabaseTest = 'Connection successful';
      }
    } catch (error) {
      supabaseError = error instanceof Error ? error.message : String(error);
    }
    
    // Check environment variables
    const envCheck = {
      hasClerkPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY,
      hasClerkWebhookSecret: !!process.env.CLERK_WEBHOOK_SECRET,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      clerkPublishableKeyPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 20) + '...',
      clerkSecretKeyPrefix: process.env.CLERK_SECRET_KEY?.substring(0, 20) + '...',
    };
    
    const possibleIssues: string[] = [];
    
    // Add diagnosis
    if (!authResult?.userId) {
      possibleIssues.push('Server-side auth not working - no userId found');
    }
    if (authError) {
      possibleIssues.push('Auth function threw error: ' + authError);
    }
    if (!userData && authResult?.userId) {
      possibleIssues.push('UserId exists but user data not available');
    }
    if (!supabaseTest) {
      possibleIssues.push('Supabase connection failed');
    }
    if (!envCheck.hasClerkSecretKey) {
      possibleIssues.push('Missing CLERK_SECRET_KEY environment variable');
    }
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      request: {
        url: req.url,
        method: req.method,
        hasCookies: !!cookieHeader,
        cookieNames: cookieHeader.split(';').map(c => c.trim().split('=')[0]).filter(Boolean),
      },
      auth: {
        result: authResult,
        error: authError,
        isAuthenticated: !!authResult?.userId
      },
      user: {
        data: userData,
        error: userError,
        hasUserData: !!userData
      },
      supabase: {
        test: supabaseTest,
        error: supabaseError,
        connectionWorks: !!supabaseTest
      },
      environment: envCheck,
      diagnosis: {
        serverAuthWorking: !!authResult?.userId,
        userDataAvailable: !!userData,
        supabaseConnected: !!supabaseTest,
        possibleIssues
      }
    };
    
    console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
    
    return NextResponse.json(debugInfo);
    
  } catch (error: any) {
    console.error('Debug auth state error:', error);
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