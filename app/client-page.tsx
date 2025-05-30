"use client";
import '@clerk/clerk-js';
import { useEffect, useState } from 'react';
import { useAuth, useSession, UserButton } from '@clerk/nextjs';
import { useClerkSupabaseAuth, supabase } from '@/lib/supabaseClient';
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

// Demo project data
const demoProject = {
  // ... existing demo project data
};

export default function ClientPage() {
  // Auth state
  const supabaseAuth = useClerkSupabaseAuth();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { currentFile, selectedTimelineEntry } = useAppStore();
  
  // State variables
  const [visible, setVisible] = useState({
    sidebar: true,
    copilot: true,
    dashboard: false,
  });

  const [authInitialized, setAuthInitialized] = useState(false);
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
    if (isLoaded && isSignedIn) {
      console.log('Auth is ready, user is signed in');
      setAuthInitialized(true);
    } else if (isLoaded && !isSignedIn) {
      console.log('Auth is ready, but user is not signed in');
      // No need to do anything here, the middleware should redirect
    }
  }, [isLoaded, isSignedIn]);

  // Setup initial project only after auth is confirmed
  useEffect(() => {
    if (!authInitialized) return;
    
    const setupInitialProject = async () => {
      try {
        console.log('Setting up initial project');
        // Check for user data
        const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
        
        if (userError || !userData.user?.id) {
          console.error('Failed to get user data:', userError);
          return;
        }
        
        const userId = userData.user.id;
        console.log('User ID:', userId);

        // Check for existing projects
        const { data: existingProjects, error } = await supabaseAuth
          .from('projects')
          .select('id')
          .eq('owner_id', userId);

        if (error) {
          console.error('Failed to check existing projects:', error);
          return;
        }

        if (!existingProjects || existingProjects.length === 0) {
          console.log('Creating default project…');
          await createProjectWithTemplate(supabaseAuth, 'Getting Started Project', userId, 'demo-team-id');
        } else {
          console.log('Found existing projects:', existingProjects.length);
        }
      } catch (error) {
        console.error('Error in setupInitialProject:', error);
      }
    };

    setupInitialProject();
  }, [authInitialized, supabaseAuth]);

  // Fetch projects only after auth is confirmed
  useEffect(() => {
    if (!authInitialized) return;
    
    const fetchProjects = async () => {
      try {
        setLoading(true);
        console.log('Fetching projects...');
        const { data, error } = await supabaseAuth.from('projects').select('*, files(*)');
        
        if (error) {
          console.error('Error fetching projects:', error);
          // Fall back to demo project
          setProjects([demoProject]);
        } else if (!data || data.length === 0) {
          console.log('No projects found, using demo project');
          // Force a demo project for demo purposes with all default files
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
  }, [authInitialized, supabaseAuth]);

  // Fetch teams
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const fetchTeams = async () => {
      const user = (await supabaseAuth.auth.getUser()).data.user;
      if (!user?.id) return;

      const { data } = await supabaseAuth.from('team_members').select('team_id').eq('user_id', user.id);
      setTeams(data || []);
      if (Array.isArray(data) && data.length > 0) {
        setActiveTeamId(data[0].team_id);
      }
    };

    fetchTeams();
  }, [isLoaded, isSignedIn, supabaseAuth]);

  // Fetch accounts when mainView is 'accounts'
  useEffect(() => {
    if (mainView === 'accounts' && teams.length > 0) {
      supabaseAuth
        .from('accounts')
        .select('id, name, created_at')
        .in('team_id', teams.map(t => t.team_id))
        .then(({ data }) => setAccounts(data || []));
    }
  }, [mainView, teams]);

  // Fetch opportunities when an account is selected
  useEffect(() => {
    if (selectedAccount) {
      supabaseAuth
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
