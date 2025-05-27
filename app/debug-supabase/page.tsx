'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { supabase } from '@/lib/supabaseClient';

export default function DebugSupabasePage() {
  const { getToken, isSignedIn } = useAuth();
  const [status, setStatus] = useState('Checking session...');

  useEffect(() => {
    const checkSession = async () => {
      const token = await getToken({ template: 'supabase' });

      console.log('🪪 Clerk Token:', token);

      const { data, error } = await supabase.auth.getSession();

      console.log('📦 Supabase Session:', data, error);

      if (error) {
        setStatus(`❌ Supabase Error: ${error.message}`);
      } else if (!data.session) {
        setStatus('⚠️ No Supabase session found.');
      } else {
        setStatus(`✅ Supabase user: ${data.session.user.email}`);
      }
    };

    checkSession();
  }, [getToken, isSignedIn]);

  return (
    <main className="p-4">
