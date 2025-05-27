'use client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState, ReactNode } from 'react';
import { Briefcase, Users, BarChart2, UserCog } from 'lucide-react';
import { useUserTeams } from '@/hooks/useUserTeams';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

type Theme = 'light' | 'dark' | 'theme-monokai' | 'theme-greenonblack';

function Logo() {
  return (
    <div className="w-full bg-[#444444] flex justify-end items-center h-16 px-0" style={{minHeight: '56px'}}>
      <img src="/wisdom-in-motion-logo.png" alt="Wisdom-In-Motion Logo" className="w-14 h-14 rounded-sm" />
    </div>
  );
}

export default function TopBar({
  children,
  copilot,
  setCopilot,
  setMainView,
}: {
  children?: React.ReactNode;
  copilot: boolean;
  setCopilot: (value: boolean) => void;
  setMainView: (view: 'accounts' | 'opportunities' | 'opportunityDetails' | 'default') => void;
}) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('opportunities');
  const { teams, activeTeamId, setActiveTeamId, loading } = useUserTeams();
  const currentTeam = teams.find(t => t.team_id === activeTeamId);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.remove('light', 'dark', 'theme-monokai', 'theme-greenonblack');
      document.documentElement.classList.add(theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme, mounted]);

  return (
    <div className="flex flex-col h-full w-16 bg-[#444444] text-white select-none">
      {/* Logo centered horizontally at the top */}
      <div className="flex items-center justify-center w-full mt-4 mb-2">
        <Logo />
      </div>
      {/* Team Switcher */}
      <div className="mr-4">
        {teams.length <= 1 ? (
          <span className="text-sm text-yellow-400 font-semibold">
            {currentTeam ? `Team: ${currentTeam.team_id}` : loading ? 'Loading team...' : 'No team'}
          </span>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-sm text-yellow-400 font-semibold bg-gray-800 px-3 py-1 rounded hover:bg-yellow-400 hover:text-[#444444] transition">
                {currentTeam ? `Team: ${currentTeam.team_id}` : 'Select Team'} ▼
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2 bg-white text-gray-900">
              <div className="font-bold mb-2">Switch Team</div>
              {teams.map(team => (
                <button
                  key={team.team_id}
                  className={`block w-full text-left px-3 py-2 rounded hover:bg-yellow-100 ${team.team_id === activeTeamId ? 'bg-yellow-200 font-bold' : ''}`}
                  onClick={() => setActiveTeamId(team.team_id)}
                >
                  {team.team_id}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        )}
      </div>
      {/* Menu icons */}
      <div className="flex flex-col items-center gap-6 flex-1 mt-2">
        <button className={`hover:text-blue-400 relative ${activeTab === 'opportunities' ? 'text-blue-400' : ''}`}
          title="Opportunities"
          onClick={() => {
            setActiveTab('opportunities');
            setMainView('accounts');
          }}
        >
          {/* Triangle indicator for active item, now pointing left and flush to the right edge */}
          {activeTab === 'opportunities' && (
            <span className="absolute left-[44px] top-1/2 -translate-y-1/2 z-10">
              <svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="10,0 0,6 10,12" fill="#f5f6fa" />
              </svg>
            </span>
          )}
          <Briefcase className="w-6 h-6" />
        </button>
        <button className="hover:text-blue-400" title="Accounts">
          <Users className="w-6 h-6" />
        </button>
        <button className="hover:text-blue-400" title="Reporting">
          <BarChart2 className="w-6 h-6" />
        </button>
        <button className="hover:text-blue-400" title="Agents">
          <UserCog className="w-6 h-6" />
        </button>
      </div>
      {/* Clerk account widget at the bottom */}
      <div className="flex flex-col items-center mb-4 mt-auto">
        {children}
      </div>
    </div>
  );
}
