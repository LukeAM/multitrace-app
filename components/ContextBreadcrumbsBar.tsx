'use client';
import { useAppStore } from '@/lib/store';
import { useEffect, useState } from 'react';

export default function ContextBreadcrumbsBar() {
  const { currentFile } = useAppStore();
  const [lastAIInteraction, setLastAIInteraction] = useState<string | null>(null);

  useEffect(() => {
    // This could later be updated by Copilot actions
    const saved = sessionStorage.getItem('last-ai-summary');
    if (saved) setLastAIInteraction(saved);
  }, []);

  return (
    <div className="w-screen fixed left-0 bottom-0 z-40 flex items-center justify-between px-6 py-1.5 text-xs bg-blue-600 text-white shadow-sm" style={{ minHeight: 32 }}>
      <div className="flex items-center space-x-2 flex-1">
        <span className="font-semibold text-white text-xs">Context:</span>
        {currentFile ? (
          <span className="truncate">{currentFile.name}</span>
        ) : (
          <span className="italic text-white/80">No file selected</span>
        )}
      </div>
      {lastAIInteraction && (
        <div className="italic truncate text-2xs text-white/80 ml-4">
          Last AI output: {lastAIInteraction}
        </div>
      )}
    </div>
  );
}
