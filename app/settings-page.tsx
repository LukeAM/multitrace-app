"use client";
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Editor from '@/components/Editor';
import Copilot from '@/components/Copilot';
import TopBar from '@/components/TopBar';
import { UserButton, useAuth, useUser } from '@clerk/nextjs';
import { useClerkSupabaseAuth } from '@/lib/supabaseClient';
import { ProjectProvider } from '@/lib/ProjectContext';
import { createProjectWithTemplate } from '@/lib/createProjectWithTemplate';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/lib/store';
import DealSummaryDashboard from '@/components/DealSummaryDashboard';
import DashboardShell from '@/components/DashboardShell';
import OpportunitiesList from '@/components/OpportunitiesList';
import OpportunityDetails from '@/components/OpportunityDetails';
import LegacyDemoProject from '@/components/LegacyDemoProject';
import LegacySidebar from '@/components/LegacySidebar';

// draft file only. need to work on this. 

export default function ClientPage() {
  const { client: supabaseClient, isReady: supabaseReady } = useClerkSupabaseAuth();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const { currentFile, selectedTimelineEntry } = useAppStore();

  const [visible, setVisible] = useState({
    sidebar: false,
    copilot: false,
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

  const isAuthReady = isLoaded && isSignedIn && supabaseReady && user && userId;

  useEffect(() => {
    if (!isAuthReady || !supabaseClient) return;
    
    const setupInitialProject = async () => {
      try {
        const { data: existingProjects, error } = await supabaseClient
          .from('projects')
          .select('id')
          .eq('owner_id', userId);

        if (error) {
          console.log('Error checking existing projects (expected with RLS):', error.message);
          return;
        }

        if (existingProjects.length === 0) {
          console.log('Creating default project…');
          if (activeTeamId) {
            await createProjectWithTemplate(supabaseClient, 'Getting Started Project', userId, activeTeamId);
          } else {
            console.error('No active team ID for project creation');
          }
        }
      } catch (error) {
        console.error('Error in setupInitialProject:', error);
      }
    };

    setupInitialProject();
  }, [isAuthReady, supabaseClient, userId, activeTeamId]);

  useEffect(() => {
    if (!isAuthReady || !supabaseClient) return;
    
    async function fetchTeams() {
      try {
        const { data, error } = await supabaseClient
          .from('team_members')
          .select('team_id')
          .eq('user_id', userId);
          
        if (error) {
          console.log('Error fetching teams (expected with RLS):', error.message);
          return;
        }
        
        setTeams(data || []);
        if (data && data.length > 0) setActiveTeamId(data[0].team_id);
      } catch (error) {
        console.error('Error in fetchTeams:', error);
      }
    }
    fetchTeams();
  }, [isAuthReady, supabaseClient, userId]);

  // Fetch accounts when mainView is 'accounts'
  useEffect(() => {
    if (!isAuthReady || !supabaseClient || mainView !== 'accounts') return;
    
    const fetchAccounts = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('accounts')
          .select('id, name, created_at');
          
        if (error) {
          console.log('Error fetching accounts (expected with RLS):', error.message);
          return;
        }
        
        setAccounts(data || []);
      } catch (error) {
        console.error('Error in fetchAccounts:', error);
      }
    };
    
    fetchAccounts();
  }, [mainView, isAuthReady, supabaseClient]);

  // Fetch opportunities when an account is selected
  useEffect(() => {
    if (!selectedAccount || !isAuthReady || !supabaseClient) return;
    
    const fetchOpportunities = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('projects')
          .select('*')
          .eq('account_id', selectedAccount.id);
          
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

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center">Loading authentication...</div>;
  }

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

  if (loading) return <div>Loading projects…</div>;

  const clerkControls = (
    <div className="flex gap-2 items-center">
      <UserButton />
    </div>
  );

  // Add a reusable header bar for toggles with charcoal background
  function ContentHeaderBar({ onToggleCopilot, onToggleDashboard }: { onToggleCopilot: () => void, onToggleDashboard: () => void }) {
    return (
      <div className="w-full bg-[#444444] flex justify-end items-center h-12 px-6" style={{ minHeight: '48px' }}>
        <div className="flex gap-2">
          <button
            aria-label="Show Dashboard"
            onClick={onToggleDashboard}
            className="focus:outline-none hover:bg-[#555] rounded-full p-1 transition-colors bg-[#444444] text-white"
            style={{ lineHeight: 0 }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
          </button>
          <button
            aria-label="Toggle Copilot"
            onClick={onToggleCopilot}
            className="focus:outline-none hover:bg-[#555] rounded-full p-1 transition-colors bg-[#444444] text-white"
            style={{ lineHeight: 0 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41M9 12a3 3 0 1 1 6 0a3 3 0 0 1-6 0z" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Handler for selecting an account
  function handleSelectAccount(account: any) {
    setSelectedAccount(account);
  }

  // Handler for selecting an opportunity
  function handleSelectOpportunity(opportunity: any) {
    setSelectedOpportunity(opportunity);
    setMainView('opportunityDetails');
  }

  // Handler for going back
  function handleBackToAccounts() {
    setSelectedAccount(null);
    setMainView('accounts');
  }
  function handleBackToOpportunities() {
    setSelectedOpportunity(null);
    setMainView('opportunities');
  }

  return (
    <ProjectProvider projects={projects}>
      <div className="flex h-screen bg-[#444444]">
        <TopBar
          copilot={visible.copilot}
          setCopilot={v => setVisible(vis => ({ ...vis, copilot: v }))}
          setMainView={setMainView}
        >
          <div className="flex items-center gap-4">{clerkControls}</div>
        </TopBar>
        {/* Accounts Sidebar */}
        <Sidebar
          accounts={accounts}
          onSelect={handleSelectAccount}
          selectedAccountId={selectedAccount?.id}
          onAccountCreated={() => setMainView('accounts')}
          showDefault={showDefault}
          onShowDefault={setShowDefault}
        />
        {/* Main Content */}
        <div className="flex flex-col flex-1 min-h-0">
          {showDefault ? (
            <LegacyDemoProject />
          ) : selectedAccount ? (
            <>
              <ContentHeaderBar
                onToggleCopilot={() => setVisible(v => ({ ...v, copilot: !v.copilot }))}
                onToggleDashboard={() => setVisible(v => ({ ...v, dashboard: !v.dashboard }))}
              />
              <div className="flex-1 min-h-0 flex flex-row">
                {mainView === 'opportunities' && (
                  <OpportunitiesList
                    account={selectedAccount}
                    opportunities={opportunities}
                    onSelect={handleSelectOpportunity}
                    onBack={handleBackToAccounts}
                  />
                )}
                {mainView === 'opportunityDetails' && selectedOpportunity && (
                  <OpportunityDetails
                    opportunity={selectedOpportunity}
                    onBack={handleBackToOpportunities}
                  />
                )}
              </div>
            </>
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