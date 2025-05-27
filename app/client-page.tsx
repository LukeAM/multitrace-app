"use client";
import '@clerk/clerk-js';
import { useEffect, useState } from 'react';
import { useAuth, useSession, UserButton } from '@clerk/nextjs';
import { useClerkSupabaseAuth } from '@/lib/supabaseClient';
import { useAppStore } from '@/lib/store';

import Sidebar from '@/components/Sidebar';
import Editor from '@/components/Editor';
import Copilot from '@/components/Copilot';
import TopBar from '@/components/TopBar';
import { ProjectProvider } from '@/lib/ProjectContext';
import DealSummaryDashboard from '@/components/DealSummaryDashboard';
import DashboardShell from '@/components/DashboardShell';
import OpportunitiesList from '@/components/OpportunitiesList';
import OpportunityDetails from '@/components/OpportunityDetails';
import LegacyDemoProject from '@/components/LegacyDemoProject';
import LegacySidebar from '@/components/LegacySidebar';

export default function ClientPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <div>Redirecting...</div>;

  return <ClientPageInner />;
}

function ClientPageInner() {
  const supabase = useClerkSupabaseAuth();
  const { isLoaded, isSignedIn } = useAuth();
  const { session } = useSession();
  const { currentFile } = useAppStore();

  const [visible, setVisible] = useState({ sidebar: true, copilot: true, dashboard: false });
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedDashboardSection, setSelectedDashboardSection] = useState<string | null>(null);
  const [mainView, setMainView] = useState<'accounts' | 'opportunities' | 'opportunityDetails' | 'default'>('accounts');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any | null>(null);
  const [showDefault, setShowDefault] = useState(false);
  const [teams, setTeams] = useState<Array<{ team_id: string }>>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);

  // Inject Supabase session via Clerk token
  useEffect(() => {
    const setSession = async () => {
      if (!isLoaded || !isSignedIn) return;
  
      const token = await window.Clerk?.session?.getToken({ template: 'supabase' });
      if (!token) {
        console.warn('No Clerk token found');
        return;
      }
  
      const { error } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: token, // optional but safe to include
      });
  
      if (error) console.error('❌ Supabase session error:', error);
      else console.log('✅ Supabase session set');
    };
  
    setSession();
  }, [isLoaded, isSignedIn, supabase]);
  

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('projects').select('*, files(*)');
      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }
      setProjects(data || []);
      setLoading(false);
    };

    fetchProjects();
  }, [supabase]);

  // Fetch teams
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const fetchTeams = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user?.id) return;

      const { data } = await supabase.from('team_members').select('team_id').eq('user_id', user.id);
      setTeams(data || []);
      if (Array.isArray(data) && data.length > 0) {
        setActiveTeamId(data[0].team_id);
      }
    };

    fetchTeams();
  }, [isLoaded, isSignedIn, supabase]);

  // Fetch accounts when mainView is 'accounts'
  useEffect(() => {
    if (mainView === 'accounts' && teams.length > 0) {
      supabase
        .from('accounts')
        .select('id, name, created_at')
        .in('team_id', teams.map(t => t.team_id))
        .then(({ data }) => setAccounts(data || []));
    }
  }, [mainView, teams]);

  // Fetch opportunities when an account is selected
  useEffect(() => {
    if (selectedAccount) {
      supabase
        .from('projects')
        .select('*')
        .eq('account_id', selectedAccount.id)
        .then(({ data }) => setOpportunities(data || []));
      setMainView('opportunities');
    }
  }, [selectedAccount]);

  if (loading) return <div>Loading projects…</div>;

  return (
    <ProjectProvider projects={projects}>
      <div className="flex h-screen bg-[#444444]">
        <TopBar
          copilot={visible.copilot}
          setCopilot={v => setVisible(vis => ({ ...vis, copilot: v }))}
          setMainView={setMainView}
        >
          <div className="flex items-center gap-4">
            <UserButton />
          </div>
        </TopBar>
        <Sidebar
          accounts={accounts}
          onSelect={setSelectedAccount}
          selectedAccountId={selectedAccount?.id}
          onAccountCreated={() => setMainView('accounts')}
          showDefault={showDefault}
          onShowDefault={setShowDefault}
        />
        <div className="flex flex-col flex-1 min-h-0">
          {selectedAccount ? (
            <div className="flex-1 min-h-0 flex flex-row">
              {mainView === 'opportunities' && (
                <OpportunitiesList
                  account={selectedAccount}
                  opportunities={opportunities}
                  onSelect={setSelectedOpportunity}
                  onBack={() => {
                    setSelectedAccount(null);
                    setMainView('accounts');
                  }}
                />
              )}
              {mainView === 'opportunityDetails' && selectedOpportunity && (
                <OpportunityDetails
                  opportunity={selectedOpportunity}
                  onBack={() => {
                    setSelectedOpportunity(null);
                    setMainView('opportunities');
                  }}
                />
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">
              Select an account to view opportunities
            </div>
          )}
        </div>
      </div>
    </ProjectProvider>
  );
}
