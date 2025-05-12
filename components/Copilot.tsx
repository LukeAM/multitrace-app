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
import { Copy, Trash2, Save, Settings, X, CornerDownLeft, ArrowDown } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';


export default function Copilot() {
  const { toast } = useToast();
  const {
    currentFile,
    projects,
    addFileToProject,
    setCurrentFile,
  } = useAppStore();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [contextMode, setContextMode] = useState<'current' | 'all' | 'subset'>('current');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [fileNameInput, setFileNameInput] = useState('');
  const [theme, setTheme] = useState('light');
  const [copilotTab, setCopilotTab] = useState<'private' | 'discovery'>('private');
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (contextMode === 'subset' && currentFile) {
      setSelectedFiles([currentFile.id]);
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
    if (!input || !context) return;

    setError(null);
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setLoading(true);
    setIsTyping(true);
    setInput('');

    // Add placeholder for AI message
    setMessages(prev => [...prev, { role: 'ai', text: '' }]);

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        body: JSON.stringify({ prompt: input, context }),
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
        description: "Failed to get response from Copilot",
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
    <Card className="h-full min-h-0 flex flex-col border-l border-gray-800 bg-gradient-to-br from-[#181A20] to-[#23272e] shadow-2xl overflow-hidden">
      {/* Header/Toolbar */}
      <CardHeader className="flex flex-row items-center justify-between px-4 py-2 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <span className="font-mono text-base font-semibold tracking-tight text-gray-900 opacity-90">Copilot</span>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-500" onClick={clearChat} aria-label="Clear chat">
                <X className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear chat</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-500" aria-label="Settings">
                <Settings className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings (coming soon)</TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      {/* Chat area */}
      <CardContent className="flex-1 min-h-0 px-0 py-0 overflow-y-auto relative bg-gray-50">
        <div ref={chatAreaRef} className="flex flex-col gap-2 px-4 py-4 pb-8 h-full">
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div key={i} className={`group flex flex-col items-${isUser ? 'end' : 'start'} w-full relative`}>
                <div
                  className={`relative px-4 py-2 rounded-lg font-mono text-[15px] leading-relaxed shadow-sm transition-all
                    ${isUser
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'bg-white text-gray-900 border-l-4 border-blue-500/80'}
                  `}
                  style={{ maxWidth: 600, alignSelf: isUser ? 'flex-end' : 'flex-start', wordBreak: 'break-word', whiteSpace: 'pre-line' }}
                  title={new Date().toLocaleTimeString()}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      code: ({ children }) => <code className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[14px] font-mono">{children}</code>,
                      pre: ({ children }) => <pre className="bg-gray-100 text-blue-900 p-3 rounded-lg font-mono text-[14px] overflow-x-auto my-2">{children}</pre>,
                      a: ({ children }) => <a className="text-blue-600 underline">{children}</a>,
                      strong: ({ children }) => <strong className="text-blue-700 font-bold">{children}</strong>,
                    }}
                  >
                    {extractMessage(msg.text)}
                  </ReactMarkdown>
                  {/* Message actions */}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => copyMessage(msg.text)} className="h-6 w-6 p-0 text-gray-400 hover:text-blue-500">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy</TooltipContent>
                    </Tooltip>
                    {!isUser && i === messages.length - 1 && msg.text && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={saveAsNote} className="h-6 w-6 p-0 text-gray-400 hover:text-green-500">
                            <Save className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Save as note</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {/* Timestamp on hover */}
                  <span className="absolute -bottom-5 left-2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity select-none">
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
      </CardContent>
      {/* Input area */}
      <CardFooter className="flex-shrink-0 px-4 py-3 bg-white border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Copilot... (⌘K to focus, ⌘Enter to send)"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-[14px] font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-gray-400"
            autoFocus
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                size="icon"
                className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                disabled={loading || !input.trim()}
                aria-label="Send"
              >
                <CornerDownLeft className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send (⌘Enter)</TooltipContent>
          </Tooltip>
        </form>
      </CardFooter>
      {/* Context controls (collapsible) */}
      <div className="px-4 py-2 bg-white/90 border-t border-gray-200 text-xs text-gray-500 flex items-center gap-4">
        <span className="font-mono text-xs">Context:</span>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={contextMode === 'current' ? 'secondary' : 'ghost'} size="icon" onClick={() => setContextMode('current')} aria-label="Current file">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M8 8h8v8H8z" fill="currentColor"/></svg>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Current file</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={contextMode === 'subset' ? 'secondary' : 'ghost'} size="icon" onClick={() => setContextMode('subset')} aria-label="Subset">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/><rect x="8" y="8" width="8" height="8" rx="1" fill="currentColor"/></svg>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Subset</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={contextMode === 'all' ? 'secondary' : 'ghost'} size="icon" onClick={() => setContextMode('all')} aria-label="All files">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M6 6h12v12H6z" fill="currentColor"/></svg>
              </Button>
            </TooltipTrigger>
            <TooltipContent>All files</TooltipContent>
          </Tooltip>
        </div>
        {contextMode === 'subset' && (
          <div className="ml-4 flex flex-wrap gap-1 max-w-[300px]">
            {projects.flatMap((p) => p.files).map((file) => (
              <label key={file.id} className="inline-flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs hover:bg-blue-100">
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
                  className="accent-blue-600 mr-1"
                />
                {file.name}
              </label>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}