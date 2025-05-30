'use client';
import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css'; // or any other highlight.js theme
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Copy, Trash2, Save, Settings, X, CornerDownLeft, ArrowDown, File, Files, CheckSquare } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import CopilotSettings, { CopilotSettings as CopilotSettingsType } from './CopilotSettings';

interface CopilotProps {
  legacy?: boolean;
}

export default function Copilot({ legacy }: CopilotProps) {
  const { toast } = useToast();
  const {
    currentFile,
    projects,
    addFileToProject,
    setCurrentFile,
  } = useAppStore();
  const accountName = projects && projects.length > 0 ? projects[0].name : 'Account';

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [contextMode, setContextMode] = useState<'current' | 'all' | 'subset'>('all');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [fileNameInput, setFileNameInput] = useState('');
  const [theme, setTheme] = useState<'green' | 'monokai' | 'dark' | 'light'>('light');
  const [copilotTab, setCopilotTab] = useState<'private' | 'discovery'>('private');
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [settings, setSettings] = useState<CopilotSettingsType>({
    endpoint: 'default',
    customApiUrl: '',
    customApiKey: ''
  });

  useEffect(() => {
    if (contextMode === 'subset' && currentFile) {
      setSelectedFiles([currentFile.id]);
    }
    if (currentFile && contextMode !== 'current') {
      setContextMode('current');
    }
  }, [contextMode, currentFile]);

  useEffect(() => {
    // Detect theme from document element
    const html = document.documentElement;
    if (html.classList.contains('theme-greenonblack')) setTheme('green');
    else if (html.classList.contains('theme-monokai')) setTheme('monokai');
    else if (html.classList.contains('dark')) setTheme('dark');
    else setTheme('light');
  }, []);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('copilotSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.endpoint && (parsed.endpoint === 'default' || parsed.endpoint === 'custom')) {
          setSettings({
            endpoint: parsed.endpoint,
            customApiUrl: parsed.customApiUrl || '',
            customApiKey: parsed.customApiKey || ''
          });
        }
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
      }
    }
  }, []);

  // Scroll to bottom on new messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  // Ref for the chat area to force scroll
  const chatAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter to send message
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        const form = document.querySelector('form');
        form?.requestSubmit();
      }
      // Cmd/Ctrl + K to focus input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector('input[type="text"]') as HTMLInputElement;
        input?.focus();
      }
      // Cmd/Ctrl + L to clear chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        setMessages([]);
        toast({
          title: "Chat cleared",
          description: "All messages have been cleared",
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Copy message to clipboard
  const copyMessage = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Message has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy message to clipboard",
        variant: "destructive",
      });
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    toast({
      title: "Chat cleared",
      description: "All messages have been cleared",
    });
  };

  const getContext = () => {
    const files = projects.flatMap((p) => p.files);

    if (contextMode === 'current') {
      return currentFile?.content || '';
    }

    if (contextMode === 'all') {
      return files.map((f) => `## ${f.name}\n${f.content}`).join('\n\n');
    }

    if (contextMode === 'subset') {
      return files
        .filter((f) => selectedFiles.includes(f.id))
        .map((f) => `## ${f.name}\n${f.content}`)
        .join('\n\n');
    }

    return '';
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const context = getContext();
    if (!input) {
      toast({
        title: "No input",
        description: "Please enter a message before submitting.",
        variant: "destructive",
      });
      return;
    }
    if (!context) {
      toast({
        title: "No context available",
        description: "Please select a file or add files to your project before using Copilot.",
        variant: "destructive",
      });
      return;
    }

    setError(null);
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setLoading(true);
    setIsTyping(true);
    setInput('');

    // Add placeholder for AI message
    setMessages(prev => [...prev, { role: 'ai', text: '' }]);

    try {
      let endpoint = '/api/copilot';
      let body: any = { prompt: input, context };

      // Use custom endpoint if configured
      if (settings.endpoint === 'custom') {
        if (!settings.customApiUrl) {
          throw new Error('Custom API URL is not configured');
        }
        
        endpoint = '/api/copilot/custom';
        body = {
          ...body,
          apiKey: settings.customApiKey,
          apiUrl: settings.customApiUrl
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error('Failed to get response from Copilot');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let result = '';
      let aiIndex = -1;
      setMessages(prev => {
        aiIndex = prev.length - 1;
        return prev;
      });

      while (true) {
        const { value, done } = await reader!.read();
        if (done) break;
        const chunk = decoder.decode(value);
        result += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[aiIndex] = { role: 'ai', text: result };
          return updated;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to get response from Copilot",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  }

  function saveAsNewFile() {
    if (!messages[messages.length - 1].text.trim()) return;

    const now = new Date();
    const suffix = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const safeName = fileNameInput.trim() || 'CopilotOutput';
    const finalName = `${safeName}_${suffix}.md`;

    const newFile = {
      id: `copilot-${Date.now()}`,
      name: finalName,
      type: 'markdown' as const,
      content: messages[messages.length - 1].text,
    };

    const firstProject = projects[0];
    addFileToProject(firstProject.id, [newFile]);
    setCurrentFile(newFile);
    setFileNameInput('');
  }

  function saveAsNote() {
    if (!messages[messages.length - 1].text.trim()) return;

    const now = new Date();
    const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, '');
    const hhmmss = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const finalName = `Note_${yymmdd}_${hhmmss}.md`;

    const newFile = {
      id: `note-${Date.now()}`,
      name: finalName,
      type: 'markdown' as const,
      content: messages[messages.length - 1].text,
    };

    const firstProject = projects[0];
    addFileToProject(firstProject.id, [newFile]);
    setCurrentFile(newFile);
  }

  // Inline style maps for message blocks
  const styleMap = {
    green: {
      user: {
        background: '#002200', color: '#33FF33', borderLeft: '4px solid #33FF33', fontWeight: 500
      },
      ai: {
        background: '#003300', color: '#B6FFB6', borderLeft: '4px solid #B6FFB6', fontWeight: 500
      }
    },
    monokai: {
      user: {
        background: '#1e1f1c', color: '#F8F8F2', borderLeft: '4px solid #F92672', fontWeight: 500
      },
      ai: {
        background: '#383830', color: '#F8F8F2', borderLeft: '4px solid #A6E22E', fontWeight: 500
      }
    },
    dark: {
      user: {
        background: '#23272e', color: '#fff', borderLeft: '4px solid #60a5fa', fontWeight: 500
      },
      ai: {
        background: '#1e293b', color: '#a3e635', borderLeft: '4px solid #a3e635', fontWeight: 500
      }
    },
    light: {
      user: {
        background: '#f3f4f6', color: '#222', borderLeft: '4px solid #2563eb', fontWeight: 500
      },
      ai: {
        background: '#fff', color: '#222', borderLeft: '4px solid #22c55e', fontWeight: 500
      }
    }
  };

  // Utility to extract human-readable text from JSON-like AI responses
  function extractMessage(text: string): string {
    try {
      // Try to parse as JSON and extract a 'response' or 'message' field
      const obj = JSON.parse(text);
      if (typeof obj === 'object') {
        // If there's a response/message key, use it
        if (obj.response) return obj.response;
        if (obj.message) return obj.message;
        // Otherwise, return the first value
        const firstKey = Object.keys(obj)[0];
        if (firstKey) return obj[firstKey];
      }
    } catch {}
    // Fallback: strip leading/trailing braces and quotes if present
    let cleaned = text.trim();
    if (/^\{.*\}$/.test(cleaned)) {
      cleaned = cleaned.replace(/^\{+|\}+$/g, '');
      // Remove key if present
      cleaned = cleaned.replace(/^(response|message)\s*:\s*/, '');
      cleaned = cleaned.replace(/^"|"$/g, '');
    }
    // Replace escaped newlines with real newlines
    cleaned = cleaned.replace(/\\n/g, '\n');
    // Remove extra quotes
    cleaned = cleaned.replace(/^"|"$/g, '');
    return cleaned;
  }

  return (
    <div className={`h-full min-h-0 flex flex-col ${legacy ? 'rounded-none shadow-none bg-white' : 'bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 rounded-lg shadow-lg'}`}>
      {/* Header/Toolbar */}
      <div className="flex flex-row items-center justify-between px-6 py-4 h-[64px] bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40 border-t-2 border-blue-700">
        <span className="font-bold text-lg text-blue-900 dark:text-blue-100 tracking-tight">{accountName} Copilot</span>
        <div className="flex items-center gap-2">
          <CopilotSettings onSettingsChange={setSettings} />
          <div className="relative">
            <select
              className="bg-transparent border border-blue-200 dark:border-blue-900 rounded px-2 py-1 text-blue-900 dark:text-blue-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 transition pr-6 appearance-none"
              defaultValue="auto"
            >
              <option value="auto">auto</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 dark:text-blue-200">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </div>
        </div>
      </div>
      {/* Context info below header */}
      <div className="px-6 py-2 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-100 flex items-center gap-2">
        <span className="font-semibold">Context:</span>
        <span>
          {contextMode === 'current' && currentFile ? currentFile.name :
            contextMode === 'subset' && selectedFiles.length > 0 ? selectedFiles.map(id => {
              const file = projects.flatMap(p => p.files).find(f => f.id === id);
              return file ? file.name : id;
            }).join(', ') :
            contextMode === 'all' ? 'All files' : 'None'}
        </span>
        <div className="flex items-center gap-2 ml-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={contextMode === 'current' ? 'secondary' : 'outline'} size="icon" className={`border border-gray-300 bg-white rounded-md p-1 shadow-sm ${contextMode === 'current' ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setContextMode('current')} aria-label="Current file">
                <File className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Current file</TooltipContent>
          </Tooltip>
          {/* Subset button with popover */}
          <Popover open={contextMode === 'subset'} onOpenChange={open => setContextMode(open ? 'subset' : 'current')}>
            <PopoverTrigger asChild>
              <Button variant={contextMode === 'subset' ? 'secondary' : 'outline'} size="icon" className={`border border-gray-300 bg-white rounded-md p-1 shadow-sm ${contextMode === 'subset' ? 'ring-2 ring-blue-500' : ''}`} aria-label="Subset">
                <CheckSquare className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-64">
              <ScrollArea className="h-60 w-full p-2">
                <div className="flex flex-col gap-1">
                  {projects.flatMap((p) => p.files).map((file) => (
                    <label key={file.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() =>
                          setSelectedFiles((prev) =>
                            prev.includes(file.id)
                              ? prev.filter((id) => id !== file.id)
                              : [...prev, file.id]
                          )
                        }
                        className="accent-blue-600"
                      />
                      <span className="truncate">{file.name}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
              {selectedFiles.length > 0 && (
                <span className="truncate max-w-[180px] text-xs text-foreground block px-2 pt-2">{selectedFiles.map(id => {
                  const file = projects.flatMap(p => p.files).find(f => f.id === id);
                  return file ? file.name : id;
                }).join(', ')}</span>
              )}
            </PopoverContent>
          </Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={contextMode === 'all' ? 'secondary' : 'outline'} size="icon" className={`border border-gray-300 bg-white rounded-md p-1 shadow-sm ${contextMode === 'all' ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setContextMode('all')} aria-label="All files">
                <Files className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>All files</TooltipContent>
          </Tooltip>
        </div>
      </div>
      {/* Chat area */}
      <div className="flex-1 min-h-0 px-0 py-0 overflow-y-auto relative bg-white dark:bg-gray-900">
        <div ref={chatAreaRef} className="flex flex-col gap-4 px-4 py-4 pb-8 h-full">
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            const style = styleMap[theme][isUser ? 'user' : 'ai'];
            return (
              <div key={i} className={`group flex flex-col items-${isUser ? 'end' : 'start'} w-full relative`}>
                <div
                  className={`relative px-3 py-2 rounded-md text-sm leading-snug transition-all max-w-[520px] self-${isUser ? 'end' : 'start'} whitespace-pre-line`}
                  style={{ ...style, wordBreak: 'break-word' }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      code: ({ children }) => <code className="bg-background text-foreground px-1 py-0.5 rounded text-[13px] font-mono">{children}</code>,
                      pre: ({ children }) => <pre className="bg-background text-foreground p-2 rounded font-mono text-[13px] overflow-x-auto my-2">{children}</pre>,
                      a: ({ children }) => <a className="text-blue-600 underline">{children}</a>,
                      strong: ({ children }) => <strong className="text-foreground font-bold">{children}</strong>,
                    }}
                  >
                    {extractMessage(msg.text)}
                  </ReactMarkdown>
                  {/* Message actions */}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => copyMessage(msg.text)} className="h-5 w-5 p-0 text-gray-400 hover:text-blue-500">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy</TooltipContent>
                    </Tooltip>
                    {!isUser && i === messages.length - 1 && msg.text && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={saveAsNote} className="h-5 w-5 p-0 text-gray-400 hover:text-green-500">
                            <Save className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Save as note</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {/* Timestamp on hover */}
                  <span className="absolute -bottom-5 right-2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            );
          })}
          {isTyping && (
            <div className="flex items-center gap-2 text-sm text-gray-500 px-4">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>Copilot is typing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {error && (
          <div className="p-4 text-sm text-red-500 bg-red-100 rounded-lg">
            {error}
          </div>
        )}
      </div>
      {/* Input area */}
      <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 rounded-b-lg">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Copilot... (⌘K to focus, ⌘Enter to send)"
            className="flex-1 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-background text-[14px] font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-gray-400"
            autoFocus
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                size="icon"
                className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-none focus:outline-none focus:ring-2 focus:ring-blue-400 transition h-8 w-8"
                disabled={loading || !input.trim()}
                aria-label="Send"
              >
                <CornerDownLeft className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send (⌘Enter)</TooltipContent>
          </Tooltip>
        </form>
      </div>
    </div>
  );
}