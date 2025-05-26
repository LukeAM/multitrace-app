import React from 'react';

export default function DashboardShell({ children, onToggleCopilot, onToggleDashboard }: { children: React.ReactNode, onToggleCopilot?: () => void, onToggleDashboard?: () => void }) {
  return (
    <div className="flex-1 h-full min-h-0 bg-[#f5f6fa] text-gray-900 rounded-l-lg ml-2 mr-0 pl-2 pr-0 overflow-y-auto transition-colors border-l border-t border-b border-gray-200 shadow-lg flex flex-col relative">
      {(onToggleCopilot || onToggleDashboard) && (
        <div className="absolute top-4 right-6 flex gap-2 z-20">
          {onToggleDashboard && (
            <button
              aria-label="Show Dashboard"
              onClick={onToggleDashboard}
              className="focus:outline-none hover:bg-[#555] rounded-full p-1 transition-colors bg-white dark:bg-gray-800 shadow"
              style={{ lineHeight: 1 }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
            </button>
          )}
          {onToggleCopilot && (
            <button
              aria-label="Toggle Copilot"
              onClick={onToggleCopilot}
              className="focus:outline-none hover:bg-[#555] rounded-full p-1 transition-colors bg-white dark:bg-gray-800 shadow"
              style={{ lineHeight: 0 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41M9 12a3 3 0 1 1 6 0a3 3 0 0 1-6 0z" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      )}
      <div className="flex-1 min-h-0 pt-6 pr-3">{children}</div>
    </div>
  );
} 