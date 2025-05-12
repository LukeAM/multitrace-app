'use client';
import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { json } from '@codemirror/lang-json';
import { useProject } from '@/lib/ProjectContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function Editor() {
  const ref = useRef<HTMLDivElement>(null);
  const { currentFile } = useProject();
  const { toast } = useToast();

  // Improved empty state
  if (!currentFile) return (
    <Card className="h-full w-full flex flex-col items-center justify-center text-center bg-muted/30">
      <div className="flex flex-col items-center gap-2 py-12">
        <span className="text-4xl">📂</span>
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

  // File type icon helper
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

  // File type badge
  function FileTypeBadge({ type }: { type: string }) {
    return (
      <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border capitalize" aria-label={`File type: ${type}`}>{type}</span>
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
    <Card className="h-full w-full flex flex-col">
      <CardHeader className="flex flex-row items-center gap-2 py-1 px-2 border-b bg-muted/50 relative">
        <FileTypeIcon type={currentFile.type} />
        <CardTitle className="text-base font-semibold truncate max-w-[300px]">{currentFile.name}</CardTitle>
        <FileTypeBadge type={currentFile.type} />
        <div className="ml-auto flex gap-1 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Copy file content" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy file content</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Download file" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download file</TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div ref={ref} className="h-full w-full flex-1 overflow-hidden px-1 py-0 bg-background text-foreground rounded-b-xl" />
      </CardContent>
    </Card>
  );
}
