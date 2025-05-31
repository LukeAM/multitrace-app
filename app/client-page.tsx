"use client";
import '@clerk/clerk-js';
import { useEffect, useState } from 'react';
import { useAuth, useSession, UserButton, useUser } from '@clerk/nextjs';
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
import { createProjectWithTemplate } from '@/lib/createProjectWithTemplate';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

// Demo project data for fallback when no data is available
const demoProject = {
  id: 'demo-project',
  name: 'Demo Project',
  files: [
    { id: 'exec-summary', name: 'Executive Summary.md', type: 'markdown' as const, content: 'Overview of deal, goals, and strategic narrative.' },
    { id: 'buying-committee', name: 'Buying Committee.json', type: 'json' as const, content: `{
  "Champion": "Emily (Head of Data)",
  "Economic Buyer": "Jon (CFO)",
  "Security": "Ana (CISO)",
  "Procurement": "Sergio"
}` },
    { id: 'objections', name: 'Common Objections.md', type: 'markdown' as const, content: '- What if OpenAI changes pricing?\n- How do we keep data private?\n- Why not build it ourselves?' },
  ]
};

export default function ClientPage() {
  // Auth state
  const { client: supabaseClient, isReady: supabaseReady } = useClerkSupabaseAuth();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { session } = useSession();
  const { user } = useUser();
  const { currentFile, selectedTimelineEntry } = useAppStore();

  // State variables
  const [visible, setVisible] = useState({
    sidebar: true,
    copilot: true,
    dashboard: false,
  });

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

  // Check if everything is ready
  const isAuthReady = isLoaded && isSignedIn && supabaseReady && user;

  // Fetch projects when auth is ready
  useEffect(() => {
    if (!isAuthReady || !supabaseClient) return;
    
    const fetchProjects = async () => {
      try {
      setLoading(true);
        console.log('Fetching projects for user:', userId);
        
        // Try to fetch projects - if we get RLS errors, fall back to demo data
        const { data, error } = await supabaseClient
          .from('projects')
          .select('*, files(*)')
          .order('created_at', { ascending: false });
        
      if (error) {
          console.log('Error fetching projects (expected with RLS):', error.message);
          console.log('Using demo project data');
          setProjects([demoProject]);
        } else if (!data || data.length === 0) {
          console.log('No projects found, using demo project');
          setProjects([demoProject]);
        } else {
          console.log('Projects fetched successfully:', data.length);
          setProjects(data);
        }
      } catch (error) {
        console.error('Error in fetchProjects:', error);
        setProjects([demoProject]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [isAuthReady, supabaseClient, userId]);

  // Fetch teams when auth is ready
  useEffect(() => {
    if (!isAuthReady || !supabaseClient) return;

    const fetchTeams = async () => {
      try {
        console.log('Fetching teams for user:', userId);
        
        // Try to get team that was created by user sync
        const teamId = `team-${userId}`;
        console.log('Looking for team:', teamId);
        
        // Check if team exists directly
        const { data: teamData, error: teamError } = await supabaseClient
          .from('teams')
          .select('id')
          .eq('id', teamId)
          .single();
          
        if (teamData) {
          console.log('Found team:', teamData.id);
          setActiveTeamId(teamData.id);
          setTeams([{ team_id: teamData.id }]);
          return;
        }
        
        // Fallback to team_members query
        const { data, error } = await supabaseClient
          .from('team_members')
          .select('team_id')
          .eq('user_id', userId);
          
        if (error) {
          console.log('Error fetching teams (expected with RLS):', error.message);
          return;
        }
        
        console.log('Team members query result:', data);
        setTeams(data || []);
        if (Array.isArray(data) && data.length > 0) {
          console.log('Setting active team to:', data[0].team_id);
          setActiveTeamId(data[0].team_id);
        } else {
          console.log('No teams found for user - user sync should have created one');
        }
      } catch (error) {
        console.error('Error in fetchTeams:', error);
      }
    };

    fetchTeams();
  }, [isAuthReady, supabaseClient, userId]);

  // Fetch accounts when mainView is 'accounts' AND teams are loaded
  useEffect(() => {
    console.log('Account fetch effect triggered:', {
      isAuthReady,
      supabaseClient: !!supabaseClient,
      teamsLength: teams.length,
      teams: teams,
      mainView,
      activeTeamId
    });
    
    // Don't fetch accounts until we have a team ID
    if (!isAuthReady || !supabaseClient || !activeTeamId || mainView !== 'accounts') {
      console.log('Skipping account fetch:', {
        isAuthReady,
        hasClient: !!supabaseClient,
        activeTeamId,
        mainView
      });
      return;
    }

    const fetchAccounts = async () => {
      try {
        console.log('Fetching accounts for team:', activeTeamId);
        
        const { data, error } = await supabaseClient
          .from('accounts')
          .select('id, name, created_at, type')
          .eq('team_id', activeTeamId)  // Use activeTeamId directly instead of teams array
          .order('created_at', { ascending: false });
          
        if (error) {
          console.log('Error fetching accounts:', error.message);
          return;
        }
        
        console.log('Accounts fetched successfully:', data?.length || 0, data);
        setAccounts(data || []);
      } catch (error) {
        console.error('Error in fetchAccounts:', error);
      }
    };
    
    fetchAccounts();
  }, [mainView, activeTeamId, isAuthReady, supabaseClient]); // Changed dependencies

  // Function to handle account creation success
  const handleAccountCreated = async () => {
    console.log('Account created, refreshing accounts list');
    // Refresh the accounts list
    if (isAuthReady && supabaseClient && activeTeamId) {
      try {
        const { data, error } = await supabaseClient
        .from('accounts')
          .select('id, name, created_at, type')
          .eq('team_id', activeTeamId)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error refreshing accounts:', error);
          return;
        }
        
        console.log('Accounts refreshed successfully:', data?.length || 0);
        setAccounts(data || []);
      } catch (error) {
        console.error('Exception refreshing accounts:', error);
      }
    }
    setMainView('accounts');
  };

  // Fetch opportunities when an account is selected
  useEffect(() => {
    if (!selectedAccount || !isAuthReady || !supabaseClient) return;

    const fetchOpportunities = async () => {
      try {
        const { data, error } = await supabaseClient
        .from('projects')
        .select('*')
        .eq('account_id', selectedAccount.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.log('Error fetching opportunities (expected with RLS):', error.message);
          return;
        }
        
        setOpportunities(data || []);
      setMainView('opportunities');
      } catch (error) {
        console.error('Error in fetchOpportunities:', error);
      }
    };
    
    fetchOpportunities();
  }, [selectedAccount, isAuthReady, supabaseClient]);

  // Show loading while auth is being set up
  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center">Loading authentication...</div>;
  }

  // Show error if not signed in
  if (!isSignedIn) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <div className="mb-4 text-xl font-bold text-red-500">Authentication Required</div>
        <div className="mb-6">Please sign in to access this application.</div>
        <a href="/sign-in" className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
          Sign In
        </a>
      </div>
    );
  }

  // Show loading while data is being fetched
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading projects...</div>;
  }

  // Main app UI
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
          onAccountCreated={handleAccountCreated}
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
