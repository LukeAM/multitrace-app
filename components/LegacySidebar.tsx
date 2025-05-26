import React, { useState } from 'react';
import { Project, File } from '@/lib/ProjectContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

// Helper for file type icons (use emoji fallback)
function FileTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'pdf': return <span title="PDF" className="text-red-500">📄</span>;
    case 'docx':
    case 'doc': return <span title="Word Document" className="text-blue-700">📝</span>;
    case 'xls': return <span title="Excel" className="text-green-600">📊</span>;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif': return <span title="Image" className="text-yellow-500">🖼️</span>;
    case 'json': return <span title="JSON" className="text-orange-500">🧾</span>;
    case 'markdown': return <span title="Markdown" className="text-purple-600">📄</span>;
    default: return <span title={type}>📁</span>;
  }
}

interface LegacySidebarProps {
  project: Project;
  currentFile: File | null;
  setCurrentFile: (file: File) => void;
}

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'kb', label: 'Knowledge Base' },
];

export default function LegacySidebar({ project, currentFile, setCurrentFile }: LegacySidebarProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'kb'>('overview');
  const [expanded, setExpanded] = useState({
    channels: false,
    artifacts: false,
    legals: false,
    timeline: true,
    master_files: false,
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Group files by section
  const grouped = {
    channels: project.files.filter((f: File) => f.section === 'Channels'),
    artifacts: project.files.filter((f: File) => f.section === 'Artifacts'),
    legals: project.files.filter((f: File) => f.section === 'Legals'),
    timeline: project.files.filter((f: File) => f.section === 'Timeline'),
    master_files: project.files.filter((f: File) => !f.section),
  };

  const toggle = (key: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-72 h-full bg-[#444444] text-white flex flex-col border-r border-gray-800 shadow-lg">
      {/* Tabs */}
      <div className="flex items-center w-full text-xs font-semibold bg-[#444444] rounded-t-lg border-b border-gray-700" style={{ minHeight: 40 }}>
        <div className="flex h-full w-full">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`relative py-2 px-4 transition-colors border-0 flex-1
                ${activeTab === tab.key
                  ? 'text-yellow-400 after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-0 after:w-8 after:h-1 after:rounded-full after:bg-yellow-400'
                  : 'text-gray-400 hover:text-yellow-400'}`}
              style={{ minWidth: 90 }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[#444444] p-2">
        {activeTab === 'overview' && (
          <div className="px-3 pt-1">
            <div className="text-base font-semibold text-white mb-2">{project?.name || 'Untitled Project'}</div>
            {/* Quick Stats - stubbed */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-200">Stakeholders</span>
              <span className="text-xs text-gray-400 ml-2">3 key contacts</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-200">PoC Scope</span>
              <span className="text-xs text-gray-400 ml-2">5 milestones</span>
            </div>
            <div className="border-t border-gray-700 my-2" />
            {/* Recent Activity - stubbed */}
            <div className="mb-1 text-xs text-gray-400 font-medium">Recent Activity</div>
            <div className="flex flex-col gap-1">
              {grouped.timeline.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center gap-2 py-1">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-base">📄</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white leading-tight">{item.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'timeline' && (
          <div className="p-2">
            <div className="text-xs text-gray-400 mb-2">Timeline (stubbed)</div>
            <ul className="space-y-2">
              {grouped.timeline.map((file) => (
                <li
                  key={file.id}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors border border-transparent hover:bg-blue-900/30 ${currentFile?.id === file.id ? 'bg-blue-900/50 border-yellow-400' : ''}`}
                  onClick={() => setCurrentFile(file)}
                >
                  <FileTypeIcon type={file.type} />
                  <span className="font-semibold text-white truncate">{file.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {activeTab === 'kb' && (
          <div className="p-2 text-xs text-gray-400">Knowledge Base (stubbed)</div>
        )}
        {/* Sectioned file lists */}
        <div className="mt-4">
          {(['channels', 'artifacts', 'legals', 'master_files'] as const).map((section, idx) => (
            <div key={section}>
              {idx > 0 && <hr className="my-2 border-t border-gray-700" />}
              <div className="flex items-center justify-between mb-1">
                <Button
                  variant="ghost"
                  className="text-left font-semibold flex items-center flex-1 px-0 py-1 justify-start"
                  onClick={() => toggle(section)}
                  aria-label={`Toggle ${section}`}
                >
                  <span className="mr-2 text-xs">{expanded[section] ? '▼' : '▶'}</span>
                  <span>{section.charAt(0).toUpperCase() + section.slice(1)}</span>
                </Button>
              </div>
              {expanded[section] && (
                <ul className="space-y-1">
                  {grouped[section].map((file: File) => (
                    <li
                      key={file.id}
                      className={`group flex items-center pl-2 pr-0 py-1 rounded gap-2 text-xs font-medium transition-all hover:bg-gray-100`}
                      onClick={() => setCurrentFile(file)}
                    >
                      <span className="flex items-center gap-2 flex-shrink-0">
                        <FileTypeIcon type={file.type} />
                      </span>
                      <span className="truncate max-w-[120px] flex-1 text-left bg-transparent border-none outline-none cursor-pointer font-medium text-white" title={file.name}>
                        {file.name}
                        {file.mandatory && <span className="text-red-500 ml-1">*</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 