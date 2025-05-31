import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { ensureUserExists } from '@/lib/userSync';

export async function POST() {
  try {
    console.log('=== Test User Creation Route Called ===');
    
    // Get current user from Clerk
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'User data not available' },
        { status: 400 }
      );
    }
    
    // Create Supabase client with service role
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
    
    console.log('Attempting to create user manually:', {
      id: userId,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName
    });
    
    // Test direct table access first
    const { data: testQuery, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
      
    if (testError) {
      console.error('Cannot access users table:', testError);
      return NextResponse.json({
        success: false,
        error: 'Cannot access users table: ' + testError.message,
        details: testError
      });
    }
    
    // Try to create the user
    const result = await ensureUserExists(supabase, {
      id: userId,
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName || '',
      lastName: user.lastName || ''
    });
    
    // Verify the user was created
    const { data: createdUser, error: verifyError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, created_at')
      .eq('id', userId)
      .single();
    
    return NextResponse.json({
      success: result.success,
      error: result.error || null,
      userCreated: !!createdUser,
      userData: createdUser,
      verifyError: verifyError?.message || null
    });
    
  } catch (error: any) {
    console.error('Test user creation error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Unknown error',
        stack: error.stack
      },
      { status: 500 }
    );
  }
} 