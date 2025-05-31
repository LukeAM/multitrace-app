import { createClient } from '@supabase/supabase-js';

interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export async function ensureUserExists(
  supabaseClient: any, 
  userData: UserData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { id: userId, email, firstName, lastName } = userData;
    
    console.log('Ensuring user exists in Supabase:', { userId, email });

    // 1. Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingUser) {
      console.log('User already exists:', userId);
      return { success: true };
    }

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking user existence:', checkError);
      return { success: false, error: checkError.message };
    }

    // 2. Create user in users table
    const { error: userError } = await supabaseClient
      .from('users')
      .insert([
        {
          id: userId,
          email: email,
          first_name: firstName || '',
          last_name: lastName || '',
          role: 'user',
          created_at: new Date().toISOString()
        }
      ]);

    if (userError && userError.code !== '23505') { // 23505 is duplicate key error
      console.error('Error creating user:', userError);
      return { success: false, error: userError.message };
    }

    // 3. Create team for the user
    const teamId = `team-${userId}`;
    const { error: teamError } = await supabaseClient
      .from('teams')
      .insert([
        {
          id: teamId,
          name: `${firstName || 'User'}'s Team`,
          created_at: new Date().toISOString()
        }
      ]);

    if (teamError && teamError.code !== '23505') { // 23505 is duplicate key error
      console.error('Error creating team:', teamError);
      return { success: false, error: teamError.message };
    }

    // 4. Add user to team as admin
    const { error: memberError } = await supabaseClient
      .from('team_members')
      .insert([
        {
          team_id: teamId,
          user_id: userId,
          role: 'admin',
          created_at: new Date().toISOString()
        }
      ]);

    if (memberError && memberError.code !== '23505') { // 23505 is duplicate key error
      console.error('Error adding user to team:', memberError);
      return { success: false, error: memberError.message };
    }

    console.log('Successfully created user, team, and team membership for:', userId);
    return { success: true };

  } catch (error) {
    console.error('Error in ensureUserExists:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Function to get or create user data for the frontend
export async function syncCurrentUser(
  supabaseClient: any,
  clerkUser: any
): Promise<{ success: boolean; error?: string }> {
  if (!clerkUser?.id || !clerkUser?.emailAddresses?.[0]?.emailAddress) {
    return { success: false, error: 'Invalid user data' };
  }

  return ensureUserExists(supabaseClient, {
    id: clerkUser.id,
    email: clerkUser.emailAddresses[0].emailAddress,
    firstName: clerkUser.firstName || '',
    lastName: clerkUser.lastName || ''
  });
} 