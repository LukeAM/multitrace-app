export async function ensureUserExists(supabase: any, user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}) {
  try {
    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .maybeSingle();

    if (existing) {
      return { success: true };
    }

    const insertPayload = {
      clerk_id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
    };

    console.log('[ensureUserExists] Insert payload:', insertPayload);

    const { error } = await supabase
      .from('users')
      .insert([insertPayload]);

    if (error) {
      console.error('[ensureUserExists] Supabase insert error:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error('[ensureUserExists] Unexpected error:', err);
    return { success: false, error: err };
  }
}
