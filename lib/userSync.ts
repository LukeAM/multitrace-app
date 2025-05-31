export async function ensureUserExists(supabase: any, user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}) {
  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .maybeSingle();

    if (existing) {
      return { success: true };
    }

    const { error } = await supabase.from('users').insert([
      {
        clerk_id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      },
    ]);

    if (error) {
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
}
