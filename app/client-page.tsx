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
  const supabaseClient = useClerkSupabaseAuth();
  const { isLoaded, isSignedIn } = useAuth();
  const { session } = useSession();
  const { currentFile, selectedTimelineEntry } = useAppStore();
  
  // State variables
  const [visible, setVisible] = useState({
    sidebar: true,
    copilot: true,
    dashboard: false,
  });

  const [authInitialized, setAuthInitialized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
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

  // Check if auth is ready before attempting data operations
  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn && session) {
        console.log('Auth is ready, user is signed in');
        setAuthInitialized(true);
        setAuthError(null);
      } else if (isSignedIn && !session) {
        console.log('User signed in but session not available yet');
        setAuthError('Session not available yet');
      } else {
        console.log('User not signed in');
        setAuthError('Not signed in');
      }
    }
  }, [isLoaded, isSignedIn, session]);

  // Fetch projects only after auth is confirmed
  useEffect(() => {
    if (!authInitialized || !supabaseClient) return;
    
    const fetchProjects = async () => {
      try {
        setLoading(true);
        console.log('Fetching projects...');
        
        // First, verify the user is authenticated with Supabase
        const { data: userData, error: userError } = await supabaseClient.auth.getUser();
        
        if (userError) {
          console.error('Error getting user from Supabase:', userError);
          setAuthError('Supabase authentication failed');
          setProjects([demoProject]);
          return;
        }
        
        if (!userData.user) {
          console.log('No user found in Supabase, using demo project');
          setProjects([demoProject]);
          return;
        }
        
        console.log('Supabase user authenticated:', userData.user.id);
        
        // Fetch projects for the authenticated user
        const { data, error } = await supabaseClient
          .from('projects')
          .select('*, files(*)')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching projects:', error);
          setProjects([demoProject]);
        } else if (!data || data.length === 0) {
          console.log('No projects found, using demo project');
          setProjects([demoProject]);
          
          // Create a default project if none exists
          try {
            await createProjectWithTemplate(
              supabaseClient, 
              'Getting Started Project', 
              userData.user.id, 
              'demo-team-id'
            );
            console.log('Created default project');
          } catch (err) {
            console.error('Error creating default project:', err);
          }
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
  }, [authInitialized, supabaseClient]);

  // Fetch teams
  useEffect(() => {
    if (!authInitialized || !supabaseClient) return;

    const fetchTeams = async () => {
      try {
        const { data: userData, error: userError } = await supabaseClient.auth.getUser();
        
        if (userError || !userData?.user?.id) {
          console.error('Error getting user:', userError);
          return;
        }

        const { data, error } = await supabaseClient
          .from('team_members')
          .select('team_id')
          .eq('user_id', userData.user.id);
          
        if (error) {
          console.error('Error fetching teams:', error);
          return;
        }
        
        setTeams(data || []);
        if (Array.isArray(data) && data.length > 0) {
          setActiveTeamId(data[0].team_id);
        }
      } catch (error) {
        console.error('Error in fetchTeams:', error);
      }
    };

    fetchTeams();
  }, [authInitialized, supabaseClient]);

  // Fetch accounts when mainView is 'accounts'
  useEffect(() => {
    if (!authInitialized || !supabaseClient || teams.length === 0 || mainView !== 'accounts') return;

    const fetchAccounts = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('accounts')
          .select('id, name, created_at')
          .in('team_id', teams.map(t => t.team_id))
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching accounts:', error);
          return;
        }
        
        setAccounts(data || []);
      } catch (error) {
        console.error('Error in fetchAccounts:', error);
      }
    };
    
    fetchAccounts();
  }, [mainView, teams, authInitialized, supabaseClient]);

  // Fetch opportunities when an account is selected
  useEffect(() => {
    if (!selectedAccount || !authInitialized || !supabaseClient) return;

    const fetchOpportunities = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('projects')
          .select('*')
          .eq('account_id', selectedAccount.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching opportunities:', error);
          return;
        }
        
        setOpportunities(data || []);
        setMainView('opportunities');
      } catch (error) {
        console.error('Error in fetchOpportunities:', error);
      }
    };
    
    fetchOpportunities();
  }, [selectedAccount, authInitialized, supabaseClient]);

  // If loading or auth error, show appropriate message
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading projects…</div>;
  }

  if (authError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <div className="mb-4 text-xl font-bold text-red-500">Authentication Error</div>
        <div className="mb-6">{authError}</div>
        <a href="/sign-in" className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
          Sign In Again
        </a>
      </div>
    );
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
