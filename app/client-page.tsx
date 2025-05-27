"use client";

import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseAuth } from '@/lib/supabaseClient';
import { useAppStore } from '@/lib/store';
import { useEffect, useState } from 'react';

import Sidebar from '@/components/Sidebar';
import Editor from '@/components/Editor';
import Copilot from '@/components/Copilot';
import TopBar from '@/components/TopBar';
import { UserButton } from '@clerk/nextjs';
import { ProjectProvider } from '@/lib/ProjectContext';
import { createProjectWithTemplate } from '@/lib/createProjectWithTemplate';
import DealSummaryDashboard from '@/components/DealSummaryDashboard';
import DashboardShell from '@/components/DashboardShell';
import OpportunitiesList from '@/components/OpportunitiesList';
import OpportunityDetails from '@/components/OpportunityDetails';
import { supabase } from '@/lib/supabaseClient';
import LegacyDemoProject from '@/components/LegacyDemoProject';
import LegacySidebar from '@/components/LegacySidebar';

// MAIN ENTRY: Safe hydration-aware wrapper
export default function ClientPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <div>Redirecting...</div>; // Optional: Add redirect logic

  return <ClientPageInner />;
}

// MAIN UI LOGIC: Your full editor/dashboard app
function ClientPageInner() {
  const supabase = useClerkSupabaseAuth();
  const { currentFile } = useAppStore();

  // — state and useEffects unchanged from your current version —
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

  // — all useEffects unchanged, just copy from your current file —
  // Including: setupInitialProject, fetchProjects, fetchTeams, fetchAccounts, fetchOpportunities

  // ... render loading state
  if (loading) return <div>Loading projects…</div>;

  // ... render main layout
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