import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabaseClient';

export function useUserTeams() {
  const { user, isLoaded } = useUser();
  const [teams, setTeams] = useState<Array<{ team_id: string }>>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user?.id) return;
    setLoading(true);
    supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setTeams(data || []);
        if (data && data.length > 0) setActiveTeamId(data[0].team_id);
        setLoading(false);
      });
  }, [isLoaded, user?.id]);

  return { teams, activeTeamId, setActiveTeamId, loading };
} 