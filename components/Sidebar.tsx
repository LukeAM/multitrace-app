'use client';
import { useAppStore } from '@/lib/store';
import { Project, File } from '@/lib/ProjectContext';
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createProjectWithTemplate } from '@/lib/createProjectWithTemplate';
import { useUser } from '@clerk/nextjs';
import { useClerkSupabaseAuth } from '@/lib/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type AddFileSection = 'artifacts' | 'legals' | 'channels';

// Add a new modal component for adding files
function AddFileModal({ open, onClose, section, onAdd }: { open: boolean, onClose: () => void, section: AddFileSection, onAdd: (file: File) => void }) {
  const [integration, setIntegration] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [integrationUrl, setIntegrationUrl] = useState('');
  const supabase = useClerkSupabaseAuth();
  const { user } = useUser();
  const { toast } = useToast();

  const integrations: Record<AddFileSection, { key: string; label: string; icon: string }[]> = {
    artifacts: [
      { key: 'notion', label: 'Notion', icon: '/notion.png' },
      { key: 'granola', label: 'Granola', icon: '/granola_logo.jpeg' },
    ],
    legals: [
      { key: 'upload', label: 'Upload', icon: '/upload.svg' },
    ],
    channels: [
      { key: 'upload', label: 'Upload', icon: '/upload.svg' },
    ],
  };

  async function handleIntegrationSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    setUploadError(null);
    try {
      if (!integrationUrl.trim() || !user?.id) {
        setUploadError('Please enter a valid URL and ensure you are signed in.');
        setUploading(false);
        return;
      }
      let apiUrl = '';
      let ext = 'md';
      if (integration === 'notion') apiUrl = `/api/notion/extract?url=${encodeURIComponent(integrationUrl)}`;
      if (integration === 'granola') apiUrl = `/api/granola/extract?url=${encodeURIComponent(integrationUrl)}`;
      if (!apiUrl) {
        setUploadError('Unknown integration.');
        setUploading(false);
        return;
      }
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Failed to fetch content from integration.');
      const data = await res.json();
      const markdown = data.markdown;
      const timestamp = Date.now();
      const safeUrl = integrationUrl.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const machineName = `${section}_${user.id}_${timestamp}_${integration}_${safeUrl}.${ext}`;
      const newFile: File = {
        id: machineName,
        name: integration === 'notion' && markdown.match(/^#+\s+(.+)/m)?.[1]?.trim()
          ? markdown.match(/^#+\s+(.+)/m)![1].trim()
          : `${integration}_${timestamp}.md`,
        type: 'markdown',
        content: markdown,
        section,
        sourceUrl: integrationUrl,
        createdAt: timestamp,
        created_by: user.id,
      };
      await supabase.from('files').insert([newFile]);
      onAdd(newFile);
      toast({ title: 'Artifact added', description: 'The file was added successfully.' });
      setUploading(false);
      setIntegrationUrl('');
      setIntegration(null);
      onClose();
    } catch (err: any) {
      setUploadError(err.message || 'Integration failed');
      toast({ title: 'Error', description: err.message || 'Integration failed', variant: 'destructive' });
      setUploading(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    setUploadError(null);
    try {
      const input = (document.getElementById('file-upload-input') as HTMLInputElement);
      const f = input?.files?.[0];
      if (!f || !user?.id) {
        setUploadError('No file or user.');
        setUploading(false);
        return;
      }
      const timestamp = Date.now();
      const originalName = f.name.replace(/\s+/g, '_').toLowerCase();
      const ext = originalName.split('.').pop();
      const machineName = `${section}_${user.id}_${timestamp}_${originalName}`;
      const { data, error } = await supabase.storage.from('files').upload(machineName, f, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) {
        setUploadError(error.message);
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        setUploading(false);
        return;
      }
      const url = supabase.storage.from('files').getPublicUrl(machineName).data.publicUrl;
      const newFile: File = {
        id: machineName,
        name: f.name,
        type: (ext as File['type']) || 'markdown',
        url,
        mimeType: f.type,
        section,
        createdAt: timestamp,
        created_by: user.id,
      };
      await supabase.from('files').insert([newFile]);
      onAdd(newFile);
      toast({ title: 'File uploaded', description: 'The file was uploaded successfully.' });
      setUploading(false);
      setFile(null);
      onClose();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
      toast({ title: 'Error', description: err.message || 'Upload failed', variant: 'destructive' });
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {section.charAt(0).toUpperCase() + section.slice(1)}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-4 mb-2">
          {integrations[section].map((intg: { key: string; label: string; icon: string }) => (
            <Button
              key={intg.key}
              variant={integration === intg.key ? 'secondary' : 'outline'}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border w-28 h-28 shadow-sm ${integration === intg.key ? 'border-blue-600' : 'border-gray-200'}`}
              onClick={() => setIntegration(intg.key)}
            >
              <img src={intg.icon} alt={intg.label} className="w-9 h-9 mb-1" />
              <span className="text-sm font-medium">{intg.label}</span>
              {integration === intg.key && (
                <span className="inline-block mt-1 text-blue-600 text-xs font-semibold">Selected</span>
              )}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 my-2">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs text-gray-400 font-semibold uppercase">or</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>
        {section === 'artifacts' && integration && (integration === 'notion' || integration === 'granola') && (
          <form className="flex flex-col gap-3" onSubmit={handleIntegrationSubmit}>
            <label className="block text-xs font-semibold mb-1">Paste {integration.charAt(0).toUpperCase() + integration.slice(1)} URL</label>
            <Input
              type="text"
              placeholder={`Paste ${integration} public link...`}
              value={integrationUrl}
              onChange={e => setIntegrationUrl(e.target.value)}
              disabled={uploading}
            />
            {uploadError && <div className="text-xs text-red-600">{uploadError}</div>}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" onClick={onClose} disabled={uploading}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={uploading || !integrationUrl}>
                {uploading ? 'Adding...' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        )}
        {(!integration || (section !== 'artifacts' || (integration !== 'notion' && integration !== 'granola'))) && (
          <form className="flex flex-col gap-3" onSubmit={handleUpload}>
            <label className="block text-xs font-semibold mb-1">Upload a file</label>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 bg-gray-50 dark:bg-gray-800">
              <Input id="file-upload-input" type="file" disabled={uploading} className="w-full text-sm" style={{ display: 'none' }} onChange={e => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile({
                    id: f.name + '-' + Date.now(),
                    name: f.name,
                    type: f.type.split('/')[1] as File['type'] || 'markdown',
                    url: URL.createObjectURL(f),
                    mimeType: f.type,
                    section,
                    createdAt: Date.now(),
                  } as File);
                } else {
                  setFile(null);
                }
              }} />
              <label htmlFor="file-upload-input" className="cursor-pointer flex flex-col items-center gap-2">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M12 16V4m0 0l-4 4m4-4l4 4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="16" width="16" height="4" rx="2" fill="#2563eb" fillOpacity=".1"/></svg>
                <span className="text-sm text-blue-600 font-semibold">Click to select a file</span>
                <span className="text-xs text-gray-400">or drag and drop</span>
              </label>
              {file && <div className="mt-2 text-xs text-green-600">Selected: {file.name}</div>}
            </div>
            {uploadError && <div className="text-xs text-red-600">{uploadError}</div>}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" onClick={onClose} disabled={uploading}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

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

export default function Sidebar() {
  const { projects, currentFile, setCurrentFile, addFileToProject } = useAppStore();
  const { user } = useUser();
  const supabase = useClerkSupabaseAuth();
  const [expanded, setExpanded] = useState({
    channels: false,
    artifacts: false,
    legals: false,
    timeline: true,
    files: true,
    mcp: false,
  });
  const [isDark, setIsDark] = useState(false);
  const [showGranolaInput, setShowGranolaInput] = useState(false);
  const [granolaUrl, setGranolaUrl] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [miniMenuTab, setMiniMenuTab] = useState<'opportunity' | 'collateral'>('opportunity');
  const [theme, setTheme] = useState('light');
  const [isAddingArtifact, setIsAddingArtifact] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [template, setTemplate] = useState('default');
  const [addModal, setAddModal] = useState<{ open: boolean, section: AddFileSection | null }>({ open: false, section: null });

  const toggle = (key: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  async function handleCreateProject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log('handleCreateProject called');
    if (!user?.id) {
      alert('User not loaded. Please sign in.');
      console.log('No user loaded');
      return;
    }
    setCreating(true);
    try {
      const teamId = 'demo-team-id';
      console.log('Sidebar supabase:', supabase);
      const result = await createProjectWithTemplate(supabase, projectName || 'Untitled Project', user.id, teamId);
      console.log('createProjectWithTemplate result:', result);
      if (!result) {
        alert('Failed to create project. Check the console for errors.');
        setCreating(false);
        return;
      }
      window.location.reload();
    } catch (err) {
      console.error('Error in handleCreateProject:', err);
      alert('An error occurred. Check the console for details.');
      setCreating(false);
    }
  }

  if (!projects.length) {
    return (
      <div className="p-4 text-gray-400 flex flex-col items-center justify-center h-full">
        <div>No projects found.</div>
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => setShowCreate(true)}
        >
          Create Project
        </button>
        {showCreate && (
          <form
            className="mt-4 bg-white dark:bg-gray-800 p-4 rounded shadow flex flex-col gap-2 w-full max-w-xs"
            onSubmit={handleCreateProject}
          >
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-200">Project Name</label>
            <input
              className="border rounded px-2 py-1 text-sm"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="Project Name"
              required
            />
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 mt-2">Template</label>
            <select className="border rounded px-2 py-1 text-sm" value={template} onChange={e => setTemplate(e.target.value)}>
              <option value="default">Getting Started Project (only option)</option>
            </select>
            <button
              type="submit"
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </form>
        )}
      </div>
    );
  }

  const project = projects[0];

  const grouped = {
    channels: [
      {
        id: 'slack-1',
        name: 'sales-team',
        icon: (
          <svg width="16" height="16" viewBox="0 0 122.8 122.8" style={{display: 'inline', verticalAlign: 'middle', background: '#f3f4f6', padding: 2, borderRadius: 3}}><g><path fill="#36C5F0" d="M30.3 76.7c0 6.1-5 11.1-11.1 11.1S8 82.8 8 76.7s5-11.1 11.1-11.1h11.1v11.1zm5.6 0c0-6.1 5-11.1 11.1-11.1s11.1 5 11.1 11.1v27.8c0 6.1-5 11.1-11.1 11.1s-11.1-5-11.1-11.1V76.7z"></path><path fill="#2EB67D" d="M46.9 30.3c-6.1 0-11.1-5-11.1-11.1S40.8 8 46.9 8s11.1 5 11.1 11.1v11.1H46.9zm0 5.6c6.1 0 11.1 5 11.1 11.1s-5 11.1-11.1 11.1H19.1c-6.1 0-11.1-5-11.1-11.1s5-11.1 11.1-11.1h27.8z"></path><path fill="#ECB22E" d="M92.5 46.1c0-6.1 5-11.1 11.1-11.1s11.1 5 11.1 11.1-5 11.1-11.1 11.1H92.5V46.1zm-5.6 0c0 6.1-5 11.1-11.1 11.1s-11.1-5-11.1-11.1V18.3c0-6.1 5-11.1 11.1-11.1s11.1 5 11.1 11.1v27.8z"></path><path fill="#E01E5A" d="M76.1 92.5c6.1 0 11.1 5 11.1 11.1s-5 11.1-11.1 11.1-11.1-5-11.1-11.1V92.5h11.1zm0-5.6c-6.1 0-11.1-5-11.1-11.1s5-11.1 11.1-11.1h27.8c6.1 0 11.1 5 11.1 11.1s-5 11.1-11.1 11.1H76.1z"></path></g></svg>
        ),
        sample: 'Q3 pipeline review at 2pm. Please RSVP!'
      },
      {
        id: 'slack-2',
        name: 'customer-support',
        icon: (
          <svg width="16" height="16" viewBox="0 0 122.8 122.8" style={{display: 'inline', verticalAlign: 'middle', background: '#f3f4f6', padding: 2, borderRadius: 3}}><g><path fill="#36C5F0" d="M30.3 76.7c0 6.1-5 11.1-11.1 11.1S8 82.8 8 76.7s5-11.1 11.1-11.1h11.1v11.1zm5.6 0c0-6.1 5-11.1 11.1-11.1s11.1 5 11.1 11.1v27.8c0 6.1-5 11.1-11.1 11.1s-11.1-5-11.1-11.1V76.7z"></path><path fill="#2EB67D" d="M46.9 30.3c-6.1 0-11.1-5-11.1-11.1S40.8 8 46.9 8s11.1 5 11.1 11.1v11.1H46.9zm0 5.6c6.1 0 11.1 5 11.1 11.1s-5 11.1-11.1 11.1H19.1c-6.1 0-11.1-5-11.1-11.1s5-11.1 11.1-11.1h27.8z"></path><path fill="#ECB22E" d="M92.5 46.1c0-6.1 5-11.1 11.1-11.1s11.1 5 11.1 11.1-5 11.1-11.1 11.1H92.5V46.1zm-5.6 0c0 6.1-5 11.1-11.1 11.1s-11.1-5-11.1-11.1V18.3c0-6.1 5-11.1 11.1-11.1s11.1 5 11.1 11.1v27.8z"></path><path fill="#E01E5A" d="M76.1 92.5c6.1 0 11.1 5 11.1 11.1s-5 11.1-11.1 11.1-11.1-5-11.1-11.1V92.5h11.1zm0-5.6c-6.1 0-11.1-5-11.1-11.1s5-11.1 11.1-11.1h27.8c6.1 0 11.1 5 11.1 11.1s-5 11.1-11.1 11.1H76.1z"></path></g></svg>
        ),
        sample: 'Customer asked about onboarding docs.'
      }
    ],
    artifacts: projects[0] ? projects[0].files.filter((f: File) => f.section === 'Artifacts') : [],
    legals: projects[0] ? projects[0].files.filter((f: File) => f.section === 'Legals') : [],
    timeline: projects[0] ? projects[0].files.filter((f: File) => f.section === 'Timeline') : [],
    files: projects[0] ? projects[0].files.filter((f: File) => !f.section) : [],
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const handleGranolaSubmit = async () => {
    if (!granolaUrl.trim()) return;
    setIsAddingArtifact(true);
    try {
      let data, finalName;
      if (granolaUrl.includes('granola.ai')) {
        const res = await fetch(`/api/granola/extract?url=${encodeURIComponent(granolaUrl)}`);
        data = await res.json();
        finalName = `Granola_${Date.now()}.md`;
        const newFile = {
          id: uuidv4(),
          name: finalName,
          type: 'markdown' as const,
          content: data.markdown,
          section: 'Artifacts',
          sourceUrl: granolaUrl,
          createdAt: Date.now(),
          created_by: user?.id,
          project_id: project?.id,
        };
        // Save to Supabase
        await supabase.from('files').insert([newFile]);
        setCurrentFile(newFile);
        if (project?.id) addFileToProject(project.id, [{ ...newFile, type: 'markdown' }]);
        setGranolaUrl('');
        setShowGranolaInput(false);
        setIsAddingArtifact(false);
        return;
      } else if (/notion\.(so|site)/.test(granolaUrl)) {
        try {
          const res = await fetch(`/api/notion/extract?url=${encodeURIComponent(granolaUrl)}`);
          data = await res.json();
          const match = data.markdown.match(/^#+\s+(.+)/m);
          const notionTitle = match ? match[1].trim() : `Notion_${Date.now()}`;
          const newFile = {
            id: uuidv4(),
            name: notionTitle,
            type: 'markdown' as const,
            content: data.markdown,
            section: 'Artifacts',
            sourceUrl: granolaUrl,
            createdAt: Date.now(),
            created_by: user?.id,
            project_id: project?.id,
          };
          // Save to Supabase
          await supabase.from('files').insert([newFile]);
          setCurrentFile(newFile);
          if (project?.id) addFileToProject(project.id, [{ ...newFile, type: 'markdown' }]);
        } finally {
          setGranolaUrl('');
          setShowGranolaInput(false);
          setIsAddingArtifact(false);
        }
        return;
      }
      setIsAddingArtifact(false);
    } catch (err) {
      console.error('Failed to fetch content:', err);
      setIsAddingArtifact(false);
    }
  };

  // Dummy MCP updates
  const mcpUpdates = [
    { id: 'mcp-1', name: 'Current MCP Context', content: 'Current model context protocol update.' },
    { id: 'mcp-2', name: 'History: 2024-06-01', content: 'Previous MCP update.' },
  ];

  // Simple AI stars icon for MCP
  const MCPStarIcon = () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ display: 'inline', verticalAlign: 'middle' }}>
      <path d="M10 2.5l1.09 3.36a1 1 0 00.95.69h3.54c.82 0 1.16 1.05.5 1.54l-2.87 2.09a1 1 0 00-.36 1.12l1.09 3.36c.25.78-.64 1.43-1.3.95l-2.87-2.09a1 1 0 00-1.18 0l-2.87 2.09c-.66.48-1.55-.17-1.3-.95l1.09-3.36a1 1 0 00-.36-1.12L3.92 8.09c-.66-.49-.32-1.54.5-1.54h3.54a1 1 0 00.95-.69L10 2.5z" fill="#6366f1"/>
      <circle cx="16" cy="4" r="1.5" fill="#fbbf24"/>
      <circle cx="4" cy="16" r="1" fill="#fbbf24"/>
    </svg>
  );

  return (
    <div className="w-64 h-full relative pt-0 px-0 pb-0 border-r flex flex-col text-sm theme-monokai:bg-[#1e1f1c] theme-monokai:text-[#F8F8F2] theme-greenonblack:bg-black theme-greenonblack:text-[#33FF33] dark:bg-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 theme-monokai:border-[#3e3d32] theme-greenonblack:border-[#003300]">
      <button
        className="absolute text-base text-gray-400 hover:text-red-500 transition-colors rounded focus:outline-none p-1 z-10"
        style={{
          top: '-4px',
          right: '-4px',
          lineHeight: 1,
          height: 28,
          width: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Close Sidebar"
        onClick={() => {
          const event = new CustomEvent('closeSidebar');
          window.dispatchEvent(event);
        }}
      >
        ×
      </button>
      <div>
        <div className="flex items-center w-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 theme-monokai:bg-[#23241f] theme-greenonblack:bg-black border-b border-gray-300 dark:border-gray-700 theme-monokai:border-[#3e3d32] theme-greenonblack:border-[#003300] relative" style={{minHeight: 32}}>
          <div className="flex h-full">
            {[
              { key: 'opportunity', label: 'Opportunity' },
              { key: 'collateral', label: 'Collateral' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setMiniMenuTab(tab.key as typeof miniMenuTab)}
                className={`py-2 px-3 transition-colors border-0
                  ${miniMenuTab === tab.key
                    ? 'bg-white dark:bg-gray-700 theme-monokai:bg-[#272822] theme-greenonblack:bg-black text-blue-600 dark:text-blue-400 theme-monokai:text-[#A6E22E] theme-greenonblack:text-[#33FF33]'
                    : 'text-gray-500 dark:text-gray-300 theme-monokai:text-[#75715E] theme-greenonblack:text-[#009900] hover:bg-gray-200 dark:hover:bg-gray-700 theme-monokai:hover:bg-[#3e3d32] theme-greenonblack:hover:bg-[#002200]'}
                  ${tab.key !== 'collateral' ? 'border-r border-gray-300 dark:border-gray-700 theme-monokai:border-[#3e3d32] theme-greenonblack:border-[#003300]' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {(['files', 'channels', 'artifacts', 'legals'] as const).map((section, idx) => (
          <div key={section}>
            {idx > 0 && (
              <hr className="my-2 border-t border-gray-300 dark:border-gray-700" />
            )}
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
              {(section === 'channels' || section === 'artifacts' || section === 'legals') && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="ml-1"
                        onClick={() => setAddModal({ open: true, section: section as AddFileSection })}
                        aria-label={`Add ${section.charAt(0).toUpperCase() + section.slice(1)}`}
                      >
                        <span className="text-lg font-bold">+</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Add {section.charAt(0).toUpperCase() + section.slice(1)}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {showGranolaInput && section === 'artifacts' && (
              <div className="mb-2 flex flex-col items-center">
                <div className="flex items-center mb-1 gap-2">
                  <img src="/granola_logo.jpeg" alt="Granola" style={{ width: 22, height: 22, borderRadius: 4 }} />
                  <img src="/notion.png" alt="Notion" style={{ width: 22, height: 22, borderRadius: 4 }} />
                </div>
                <input
                  type="text"
                  value={granolaUrl}
                  onChange={(e) => setGranolaUrl(e.target.value)}
                  placeholder="Paste Granola or Notion public link..."
                  className="w-full p-1 border text-xs rounded mb-1 bg-white dark:bg-gray-800 dark:text-white"
                />
                <button
                  onClick={handleGranolaSubmit}
                  className="w-full text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-60"
                  disabled={isAddingArtifact}
                >
                  {isAddingArtifact && (
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" style={{marginRight: 4}}>
                      <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="4" opacity="0.2" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                  )}
                  Add Artifact
                </button>
              </div>
            )}

            {(section === 'channels' && expanded['channels']) && (
              <ul className="space-y-1 px-0.5 py-1">
                {grouped.channels.map((channel) => (
                  <li key={channel.id} className="flex items-center pl-2 pr-0 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 theme-monokai:hover:bg-[#3e3d32] theme-greenonblack:hover:bg-[#002200] cursor-pointer">
                    <span className="flex items-center gap-2 flex-shrink-0">
                      {channel.icon}
                    </span>
                    <span className="text-xs font-semibold" title={channel.sample}>#{channel.name}</span>
                    <button className="ml-auto mr-1 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Sync Channel">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#888"><path d="M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8V2z"/><path d="M12 2v6l4-4-4-2z"/></svg>
                    </button>
                    <button
                      onClick={() => {
                        // Remove the channel from the project
                        const updatedFiles = project.files.filter(f => f.id !== channel.id);
                        addFileToProject(project.id, updatedFiles.map(f => ({ ...f, type: (f.type || 'markdown') as File["type"] })));
                      }}
                      className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      title="Delete Channel"
                    >
                      <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M6 8v6a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 11v2" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 11v2" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 6h12" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 6V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {(expanded[section]) && section !== 'channels' && (
              <div className={`transition-all duration-200 ${expanded[section] ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <ul className="space-y-1">
                  {grouped[section].map((file: File) => {
                    const isNotion = file.sourceUrl && file.sourceUrl.includes('notion');
                    const isGranola = file.content?.includes('granola.ai');
                    const isMarkdown = file.type === 'markdown';
                    const isEmail = file.name.toLowerCase().includes('email');
                    const isMaster = section === 'files';
                    const isSelected = currentFile?.id === file.id;
                    const fileDisplayName = isNotion
                      ? (typeof file.content === 'string' ? (file.content.match(/^#\s+(.+)/m)?.[1] || 'Notion Page') : 'Notion Page')
                      : file.name;
                    return (
                      <li
                        key={file.id}
                        className={`flex items-center pl-2 pr-0 py-1 rounded gap-2 text-xs font-medium transition-all
                          ${isSelected ? 'bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 shadow' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
                        `}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="flex items-center gap-2 flex-shrink-0">
                          <FileTypeIcon type={file.type} />
                        </span>
                        <button
                          onClick={() => {
                            setCurrentFile(file);
                          }}
                          className={`truncate max-w-[120px] flex-1 text-left bg-transparent border-none outline-none cursor-pointer
                            ${isSelected ? 'font-bold text-blue-700 dark:text-blue-400' : 'font-medium text-black dark:text-gray-100'}`}
                          title={fileDisplayName}
                        >
                          <span className="truncate" style={{ maxWidth: 100 }}>{fileDisplayName}</span>
                          {file.mandatory && <span className="text-red-500 ml-1">*</span>}
                        </button>
                        {/* Action buttons with tooltips */}
                        {isNotion && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="ml-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const notionUrl = file.sourceUrl;
                                    if (!notionUrl) return;
                                    fetch(`/api/notion/extract?url=${encodeURIComponent(notionUrl)}`)
                                      .then(res => res.json())
                                      .then(data => {
                                        if (file.content !== data.markdown) {
                                          const match = data.markdown.match(/^#+\s+(.+)/m);
                                          const notionTitle = match ? match[1].trim() : `Notion_${Date.now()}`;
                                          addFileToProject(project.id, project.files.map(f =>
                                            f.id === file.id
                                              ? { ...f, name: notionTitle, content: data.markdown, type: 'markdown' }
                                              : { ...f, type: (f.type || 'markdown') as File["type"] }
                                          ));
                                        } else {
                                          alert('No changes detected.');
                                        }
                                      });
                                  }}
                                  aria-label="Refresh from Notion"
                                >
                                  <span role="img" aria-label="Refresh">🔄</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Refresh from Notion</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {section !== 'files' && section !== 'legals' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="ml-2"
                                  onClick={() => {
                                    // Remove the file from the project
                                    const updatedFiles = project.files.filter((f: File) => f.id !== file.id);
                                    addFileToProject(project.id, updatedFiles.map(f => ({ ...f, type: (f.type || 'markdown') as File["type"] })));
                                  }}
                                  aria-label="Delete"
                                >
                                  <span role="img" aria-label="Delete">🗑️</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Bottom static container for MCP and Timeline */}
      <div className="px-4 pb-16 pt-2">
        <hr className="my-2 border-t border-gray-300 dark:border-gray-700" />
        {/* MCP Section - styled like other sidebar sections */}
        <div key="mcp" className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <button
              onClick={() => toggle('mcp')}
              className="text-left font-semibold flex items-center w-full"
              title="Model Context Protocol"
            >
              <span className="mr-2 text-xs">{expanded['mcp'] ? '▼' : '▶'}</span>
              <span>MCP</span>
            </button>
          </div>
          {expanded['mcp'] && (
            <ul className="space-y-1">
              {mcpUpdates.map((update: { id: string; name: string; content: string }) => (
                <li key={update.id} className="flex items-center pl-2 pr-0 py-1 rounded gap-2 text-xs font-medium">
                  <span className="flex items-center gap-2 flex-shrink-0">
                    <MCPStarIcon />
                  </span>
                  <button
                    className="truncate max-w-[140px] flex-1 text-left bg-transparent border-none outline-none cursor-pointer font-medium text-black dark:text-gray-100"
                    title={update.content}
                    style={{whiteSpace: 'normal'}}
                  >
                    {update.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Timeline Section - styled like other sidebar sections */}
        <hr className="my-2 border-t border-gray-300 dark:border-gray-700" />
        <div key="timeline" className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <button
              onClick={() => toggle('timeline')}
              className="text-left font-semibold flex items-center w-full"
            >
              <span className="mr-2 text-xs">{expanded['timeline'] ? '▼' : '▶'}</span>
              <span>Timeline</span>
            </button>
          </div>
          {expanded['timeline'] && (
            <ul className="space-y-1">
              {grouped['timeline'].map((file: File) => (
                <li key={file.id} className="flex items-center pl-2 pr-0 py-1 rounded gap-2 text-xs font-medium">
                  <span className="flex items-center gap-2 flex-shrink-0">
                    {/* Timeline icon for consistency */}
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ display: 'inline', verticalAlign: 'middle' }}>
                      <circle cx="10" cy="10" r="8" stroke="#6366f1" strokeWidth="2" fill="#f3f4f6" />
                      <rect x="9.25" y="5" width="1.5" height="5" rx="0.75" fill="#6366f1" />
                      <rect x="9.25" y="10" width="1.5" height="3" rx="0.75" fill="#6366f1" />
                    </svg>
                  </span>
                  <button
                    onClick={() => setCurrentFile(file)}
                    className={`truncate max-w-[140px] flex-1 text-left bg-transparent border-none outline-none cursor-pointer ${
                      currentFile?.id === file.id
                        ? 'font-bold text-blue-700 dark:text-blue-400'
                        : 'font-medium text-black dark:text-gray-100'
                    }`}
                    title={file.mandatory ? 'Mandatory to close a deal' : ''}
                  >
                    {file.name}
                    {file.mandatory && <span className="text-red-500 ml-1">*</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {addModal.section && (
        <AddFileModal
          open={addModal.open}
          section={addModal.section}
          onClose={() => setAddModal({ open: false, section: null })}
          onAdd={(file) => {
            if (project?.id) addFileToProject(project.id, [file]);
            setAddModal({ open: false, section: null });
          }}
        />
      )}
    </div>
  );
}
