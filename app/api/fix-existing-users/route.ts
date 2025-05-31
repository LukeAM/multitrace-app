import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function fixExistingUsersLogic() {
  console.log('=== Fix Existing Users Route Called ===');
  
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
  
  // Get all users who don't have teams
  const { data: usersWithoutTeams, error: usersError } = await supabase
    .from('users')
    .select('id, email, first_name, last_name')
    .not('id', 'in', 
      supabase
        .from('team_members')
        .select('user_id')
    );
  
  if (usersError) {
    console.error('Error fetching users without teams:', usersError);
    return {
      success: false,
      error: 'Could not fetch users: ' + usersError.message
    };
  }
  
  console.log('Found users without teams:', usersWithoutTeams?.length || 0);
  
  const results = [];
  
  if (usersWithoutTeams && usersWithoutTeams.length > 0) {
    for (const user of usersWithoutTeams) {
      const teamId = `team-${user.id}`;
      const userName = user.first_name || 'User';
      
      try {
        // Create team for the user
        const { error: teamError } = await supabase
          .from('teams')
          .insert([
            {
              id: teamId,
              name: `${userName}'s Team`,
              created_at: new Date().toISOString()
            }
          ]);

        if (teamError && teamError.code !== '23505') { // 23505 is duplicate key error
          console.error(`Error creating team for user ${user.id}:`, teamError);
          results.push({
            userId: user.id,
            email: user.email,
            success: false,
            error: 'Team creation failed: ' + teamError.message
          });
          continue;
        }

        // Add user to team as admin
        const { error: memberError } = await supabase
          .from('team_members')
          .insert([
            {
              team_id: teamId,
              user_id: user.id,
              role: 'admin',
              created_at: new Date().toISOString()
            }
          ]);

        if (memberError && memberError.code !== '23505') { // 23505 is duplicate key error
          console.error(`Error adding user ${user.id} to team:`, memberError);
          results.push({
            userId: user.id,
            email: user.email,
            success: false,
            error: 'Team membership failed: ' + memberError.message
          });
          continue;
        }
        
        results.push({
          userId: user.id,
          email: user.email,
          teamId: teamId,
          success: true
        });
        
        console.log(`Successfully created team and membership for user ${user.id}`);
        
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        results.push({
          userId: user.id,
          email: user.email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
  
  // Also check for users who have teams but no team memberships
  const { data: usersWithTeamsButNoMembership, error: membershipError } = await supabase
    .rpc('get_users_without_team_membership');
  
  if (!membershipError && usersWithTeamsButNoMembership) {
    console.log('Found users with teams but no membership:', usersWithTeamsButNoMembership.length);
    
    for (const user of usersWithTeamsButNoMembership) {
      const teamId = `team-${user.id}`;
      
      try {
        const { error: memberError } = await supabase
          .from('team_members')
          .insert([
            {
              team_id: teamId,
              user_id: user.id,
              role: 'admin',
              created_at: new Date().toISOString()
            }
          ]);

        if (memberError && memberError.code !== '23505') {
          console.error(`Error adding membership for user ${user.id}:`, memberError);
        } else {
          console.log(`Added missing membership for user ${user.id}`);
        }
      } catch (error) {
        console.error(`Error adding membership for user ${user.id}:`, error);
      }
    }
  }
  
  return {
    success: true,
    message: `Processed ${results.length} users`,
    results: results,
    summary: {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }
  };
}

export async function GET() {
  try {
    const result = await fixExistingUsersLogic();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Fix existing users error:', error);
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
    const result = await fixExistingUsersLogic();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Fix existing users error:', error);
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