"use client";
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Editor from '@/components/Editor';
import CLI from '@/components/CLI';
import Copilot from '@/components/Copilot';
import TabBar from '@/components/TabBar';
import TopBar from '@/components/TopBar';
import { UserButton } from '@clerk/nextjs';
import { useClerkSupabaseAuth } from '@/lib/supabaseClient';
import { ProjectProvider } from '@/lib/ProjectContext';
import { createProjectWithTemplate } from '@/lib/createProjectWithTemplate';
import { useAuth } from '@clerk/nextjs';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

export default function ClientPage() {
  const supabase = useClerkSupabaseAuth();
  const { isLoaded, isSignedIn } = useAuth();
  // No need to check isSignedIn or user here, server already guarantees authentication

  const [visible, setVisible] = useState({
    sidebar: true,
    cli: true,
    copilot: true,
  });

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const setupInitialProject = async () => {
      // user is guaranteed to exist, get from supabase auth
      const user = (await supabase.auth.getUser()).data.user;
      if (!user?.id) return;

      const { data: existingProjects, error } = await supabase
        .from('projects')
        .select('id')
        .eq('owner_id', user.id);

      if (error) {
        console.error('Failed to check existing projects:', error);
        return;
      }

      if (existingProjects.length === 0) {
        console.log('Creating default project…');
        await createProjectWithTemplate(supabase, 'Getting Started Project', user.id, 'demo-team-id');
      }
    };

    setupInitialProject();
  }, [isLoaded, isSignedIn, supabase]);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('projects').select('*, files(*)');
      if (!data || data.length === 0) {
        // Force a demo project for demo purposes with all default files
        setProjects([
          {
            id: 'demo-project',
            name: 'Demo Project',
            files: [
              {
                id: 'exec-summary',
                name: 'Executive Summary.md',
                type: 'markdown',
                content: 'Overview of deal, goals, and strategic narrative.',
              },
              {
                id: 'buying-committee',
                name: 'Buying Committee.json',
                type: 'json',
                content: `{
  "Champion": "Emily (Head of Data)",
  "Economic Buyer": "Jon (CFO)",
  "Security": "Ana (CISO)",
  "Procurement": "Sergio"
}`,
              },
              {
                id: 'objections',
                name: 'Common Objections.md',
                type: 'markdown',
                content: '- What if OpenAI changes pricing?\n- How do we keep data private?\n- Why not build it ourselves?',
              },
              {
                id: 'note-1',
                name: 'Note_250509_081501.md',
                type: 'markdown',
                content: 'Summarised demo feedback: Enthusiastic but concerned about latency under load.',
                section: 'Artifacts',
              },
              {
                id: 'note-2',
                name: 'Note_250509_102301.md',
                type: 'markdown',
                content: 'Copilot suggestion: Prioritise integration with Looker.',
                section: 'Artifacts',
              },
              {
                id: 'note-3',
                name: 'Note_250510_071800.md',
                type: 'markdown',
                content: 'Drafted executive summary tailored to CFO\'s language.',
                section: 'Artifacts',
              },
              {
                id: 'legal-tos',
                name: 'Legal_Terms.md',
                type: 'markdown',
                content: 'Standard terms and conditions — 30-day payment, SLA, data protection terms included.',
                section: 'Legals',
              },
              {
                id: 'legal-msa',
                name: 'MSA.md',
                type: 'markdown',
                content: 'Draft MSA received from legal, highlights:\n- Liability cap: 2x\n- Data breach: 5 days notification',
                mandatory: true,
                section: 'Legals',
              },
              {
                id: 'legal-mnda',
                name: 'mNDA.md',
                type: 'markdown',
                content: 'Mutual NDA template. Use for all partners and vendors.',
                section: 'Legals',
              },
              {
                id: 'legal-dpa',
                name: 'DPA.md',
                type: 'markdown',
                content: 'Data Processing Agreement. Required for all data integrations.',
                section: 'Legals',
              },
              {
                id: 'legal-baa',
                name: 'BAA.md',
                type: 'markdown',
                content: 'Business Associate Agreement. Required for healthcare customers (HIPAA).',
                section: 'Legals',
              },
              {
                id: 'timeline-internal',
                name: 'Timeline_InternalPrep.md',
                type: 'markdown',
                content: 'Week 1: Define use case\nWeek 2: Demo + feedback\nWeek 3: Pilot config\nWeek 4: Legal review',
                section: 'Timeline',
              },
              {
                id: 'timeline-client-facing',
                name: 'Timeline_ExternalView.md',
                type: 'markdown',
                content: 'May 1: Pilot Start\nMay 15: Evaluation Call\nMay 22: Legal\nJune 1: Contract Target',
                section: 'Timeline',
              },
              {
                id: 'close-plan',
                name: 'Close Plan.md',
                type: 'markdown',
                content: '## Key Milestones\n- Kickoff\n- Security Review\n- Close',
              },
            ],
          },
        ]);
      } else {
        setProjects(data);
      }
      setLoading(false);
    };
    fetchProjects();
  }, [supabase]);

  if (loading) return <div>Loading projects…</div>;

  const menuDropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Main menu">
          <Menu className="h-6 w-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setVisible(v => ({ ...v, sidebar: !v.sidebar }))}>
          {visible.sidebar ? 'Hide Sidebar' : 'Show Sidebar'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setVisible(v => ({ ...v, cli: !v.cli }))}>
          {visible.cli ? 'Hide CLI' : 'Show CLI'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setVisible(v => ({ ...v, copilot: !v.copilot }))}>
          {visible.copilot ? 'Hide Copilot' : 'Show Copilot'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const clerkControls = (
    <div className="flex gap-2 items-center">
      <UserButton />
    </div>
  );

  return (
    <ProjectProvider projects={projects}>
      <div className="flex flex-col h-screen theme-monokai:bg-[#272822] theme-greenonblack:bg-black">
        <TopBar>
          <div className="flex items-center gap-4">
            {menuDropdown}
            {clerkControls}
          </div>
        </TopBar>
        <div className="flex flex-1 min-h-0">
          {visible.sidebar && (
            <div className="w-64 flex-shrink-0 h-full relative">
              <Sidebar />
            </div>
          )}
          <div className="flex flex-col flex-1 min-h-0">
            <TabBar />
            <div className="flex-1 min-h-0 overflow-auto">
              <Editor />
            </div>
            {visible.cli && (
              <div className="relative">
                <button
                  onClick={() => setVisible(v => ({ ...v, cli: false }))}
                  className="absolute top-2 right-2 text-xs text-gray-400 hover:text-red-500 z-20 bg-transparent border-none p-0 m-0"
                  title="Close CLI"
                  style={{ lineHeight: 1 }}
                >
                  ×
                </button>
                <CLI />
              </div>
            )}
          </div>
          {visible.copilot && (
            <div className="w-96 flex-shrink-0 h-full min-h-0 relative">
              <button
                onClick={() => setVisible(v => ({ ...v, copilot: false }))}
                className="absolute top-2 right-2 text-xs text-gray-400 hover:text-red-500 z-20 bg-transparent border-none p-0 m-0"
                title="Close Copilot"
                style={{ lineHeight: 1 }}
              >
                ×
              </button>
              <Copilot />
            </div>
          )}
        </div>
      </div>
    </ProjectProvider>
  );
} 