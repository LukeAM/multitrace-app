import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { ensureUserExists } from '@/lib/userSync';

async function testWebhookLogic() {
  console.log('=== Test Webhook Route Called ===');
  
  // Get current user from Clerk
  const { userId } = auth();
  if (!userId) {
    return {
      error: 'Not authenticated',
      status: 401
    };
  }
  
  const user = await currentUser();
  if (!user) {
    return {
      error: 'User data not available',
      status: 400
    };
  }
  
  // Create Supabase client with service role (like the webhook does)
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
  
  console.log('Testing webhook functionality for user:', {
    id: userId,
    email: user.emailAddresses[0]?.emailAddress,
    firstName: user.firstName,
    lastName: user.lastName
  });
  
  // Test what the webhook should do
  const result = await ensureUserExists(supabase, {
    id: userId,
    email: user.emailAddresses[0]?.emailAddress || '',
    firstName: user.firstName || '',
    lastName: user.lastName || ''
  });
  
  // Check all the tables that should have been created
  const checks: any = {
    user: null,
    team: null,
    teamMember: null
  };
  
  // Check user exists
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, created_at')
    .eq('id', userId)
    .single();
  checks.user = { data: userData, error: userError?.message };
  
  // Check team exists
  const teamId = `team-${userId}`;
  const { data: teamData, error: teamError } = await supabase
    .from('teams')
    .select('id, name, created_at')
    .eq('id', teamId)
    .single();
  checks.team = { data: teamData, error: teamError?.message };
  
  // Check team membership exists
  const { data: memberData, error: memberError } = await supabase
    .from('team_members')
    .select('team_id, user_id, role, created_at')
    .eq('user_id', userId)
    .eq('team_id', teamId)
    .single();
  checks.teamMember = { data: memberData, error: memberError?.message };
  
  return {
    success: result.success,
    error: result.error || null,
    checks,
    summary: {
      userExists: !!userData,
      teamExists: !!teamData,
      teamMemberExists: !!memberData,
      allGood: !!userData && !!teamData && !!memberData
    }
  };
}

export async function GET() {
  try {
    const result = await testWebhookLogic();
    if (result.status) {
      return NextResponse.json(result, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Test webhook error:', error);
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

export async function POST() {
  try {
    const result = await testWebhookLogic();
    if (result.status) {
      return NextResponse.json(result, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Test webhook error:', error);
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