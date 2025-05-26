'use client';
import React, { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { json } from '@codemirror/lang-json';
import { useProject } from '@/lib/ProjectContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, Download, FileText, Code, Image, FileJson, FileType } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';

interface EditorProps {
  legacy?: boolean;
}

export default function Editor({ legacy }: EditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { currentFile } = useProject();
  const { toast } = useToast();
  const selectedTimelineEntry = useAppStore(state => state.selectedTimelineEntry);
  const setSelectedTimelineEntry = useAppStore(state => state.setSelectedTimelineEntry);

  // Show timeline detail panel if selected
  if (selectedTimelineEntry) return (
    <div className="h-full w-full flex flex-col bg-background dark:bg-gray-900 border-l-2 border-blue-200 dark:border-blue-900/40 shadow-inner transition-all duration-200" style={{ width: '100%' }}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/30">
        <div>
          <div className="text-xs uppercase text-blue-600 dark:text-blue-300 font-semibold mb-1 tracking-wide">Timeline Detail</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{selectedTimelineEntry.date} • {selectedTimelineEntry.type.charAt(0).toUpperCase() + selectedTimelineEntry.type.slice(1)}</div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{selectedTimelineEntry.title}</div>
        </div>
        <button
          className="ml-4 text-gray-400 hover:text-red-500 rounded p-1 text-2xl"
          title="Close"
          onClick={() => setSelectedTimelineEntry(null)}
        >
          ×
        </button>
      </div>
      {/* Show description for Notion docs */}
      {selectedTimelineEntry.type === 'notion' ? (
        <div className="px-6 py-6 text-base text-gray-700 dark:text-gray-300 flex-1 overflow-auto">
          <div className="font-semibold mb-2">{selectedTimelineEntry.title}</div>
          <div>{selectedTimelineEntry.description}</div>
        </div>
      ) : (
        <div className="px-6 py-4 text-base text-gray-700 dark:text-gray-300 mb-4 border-b border-blue-100 dark:border-blue-900/40">{selectedTimelineEntry.description}</div>
      )}
      <div className="flex-1 flex items-center justify-center text-gray-400 italic bg-white dark:bg-gray-800 rounded-b p-8 border-none">
        {selectedTimelineEntry.type === 'slack' && 'Slack channel content here...'}
      </div>
    </div>
  );

  // Improved empty state
  if (!currentFile) return (
    <Card className="h-full w-full flex flex-col items-center justify-center text-center bg-muted/30">
      <div className="flex flex-col items-center gap-2 py-12">
        <FileText className="h-12 w-12 text-muted-foreground/50" />
        <div className="text-lg font-semibold text-muted-foreground">No file selected</div>
        <div className="text-sm text-muted-foreground">Select a file from the sidebar to start editing.</div>
      </div>
    </Card>
  );

  useEffect(() => {
    if (!ref.current || !currentFile) return;

    const state = EditorState.create({
      doc: currentFile.content,
      extensions: [
        basicSetup,
        currentFile.type === 'json' ? json() : markdown(),
        EditorView.lineWrapping,
        EditorView.theme({
          '&': {
            height: '100%',
            width: '100%',
            overflow: 'auto',
            fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
            fontSize: '1rem',
            background: 'transparent',
          }
        })
      ],
    });

    const view = new EditorView({ 
      state, 
      parent: ref.current
    });
    return () => view.destroy();
  }, [currentFile]);

  // Enhanced file type icon helper
  function FileTypeIcon({ type }: { type: string }) {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
      case 'docx':
      case 'doc': return <FileText className="h-4 w-4 text-blue-700" />;
      case 'xls': return <FileText className="h-4 w-4 text-green-600" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return <Image className="h-4 w-4 text-yellow-500" />;
      case 'json': return <FileJson className="h-4 w-4 text-orange-500" />;
      case 'markdown': return <FileText className="h-4 w-4 text-purple-600" />;
      default: return <FileType className="h-4 w-4 text-muted-foreground" />;
    }
  }

  // Enhanced file type badge
  function FileTypeBadge({ type }: { type: string }) {
    return (
      <Badge variant="secondary" className="ml-2 capitalize">
        {type}
      </Badge>
    );
  }

  // Toolbar actions
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentFile.content || '');
      toast({ title: 'File content copied to clipboard.' });
    } catch {
      toast({ title: 'Could not copy file content.', variant: 'destructive' });
    }
  };
  const handleDownload = () => {
    const blob = new Blob([currentFile.content || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name || 'untitled.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`relative h-full w-full flex flex-col ${legacy ? 'rounded-none shadow-none bg-white' : 'bg-white dark:bg-gray-900 shadow-2xl rounded-l-2xl'} border-l border-gray-200 dark:border-gray-800 animate-slide-in-right`}>
      <button
        className="absolute top-3 right-3 z-10 text-gray-400 hover:text-red-500 bg-white/80 dark:bg-gray-900/80 rounded-full p-1 shadow"
        title="Close"
        onClick={() => {
          // Close the editor overlay (clear currentFile and selectedTimelineEntry)
          useAppStore.getState().setCurrentFile(null);
          useAppStore.getState().setSelectedTimelineEntry(null);
        }}
      >
        ×
      </button>
      <Card className="h-full w-full flex flex-col">
        <CardHeader className="flex flex-row items-center gap-2 py-2 px-4 border-b bg-muted/50">
          <div className="flex items-center gap-2 min-w-0">
            <FileTypeIcon type={currentFile.type} />
            <CardTitle className="text-sm font-medium truncate">{currentFile.name}</CardTitle>
            <FileTypeBadge type={currentFile.type} />
          </div>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <div className="flex gap-1 items-center ml-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0" 
                  aria-label="Copy file content" 
                  onClick={handleCopy}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy file content</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0" 
                  aria-label="Download file" 
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download file</TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <ScrollArea className="flex-1">
          <CardContent className="p-0">
            <div 
              ref={ref} 
              className="h-full w-full min-h-[calc(100vh-8rem)] px-4 py-2 bg-background text-foreground" 
            />
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
}
