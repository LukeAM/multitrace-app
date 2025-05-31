'use client';
import { useAppStore } from '@/lib/store';
import { Project, File } from '@/lib/ProjectContext';
import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createProjectWithTemplate } from '@/lib/createProjectWithTemplate';
import { useUser } from '@clerk/nextjs';
import { useClerkSupabaseAuth } from '@/lib/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Target, CreditCard, Filter } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

type AddFileSection = 'artifacts' | 'legals' | 'channels';

// Define TimelineItem type
type TimelineItem = {
  id: string;
  date: string;
  type: 'status' | 'email' | 'granola' | 'slack' | 'notion';
  title: string;
  description: string;
  icon: string;
  topics?: string[];
  metadata?: {
    createdBy?: string;
    source?: string;
    recipient?: string;
    role?: string;
    emailId?: string;
    participants?: string[];
    duration?: string;
    transcriptId?: string;
    summary?: string;
    channel?: string;
    type?: 'internal' | 'external';
    members?: string[];
    author?: string;
    documentId?: string;
    status?: string;
    qualifiedBy?: string;
    reason?: string;
  };
};

// Define stakeholder types
type StakeholderEngagement = {
  date: string;
  type: string;
  description: string;
};

type StakeholderData = {
  role: string;
  company: string;
  engagement: StakeholderEngagement[];
};

type Stakeholders = {
  [key: string]: StakeholderData;
};

// Add a new modal component for adding files
function AddFileModal({ open, onClose, section, onAdd }: { open: boolean, onClose: () => void, section: AddFileSection, onAdd: (file: File) => void }) {
  const [integration, setIntegration] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [integrationUrl, setIntegrationUrl] = useState('');
  const { client: supabaseClient, isReady } = useClerkSupabaseAuth();
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
      if (!integrationUrl.trim() || !user?.id || !supabaseClient) {
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
      await supabaseClient.from('files').insert([newFile]);
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
      if (!f || !user?.id || !supabaseClient) {
        setUploadError('No file or user.');
        setUploading(false);
        return;
      }
      const timestamp = Date.now();
      const originalName = f.name.replace(/\s+/g, '_').toLowerCase();
      const ext = originalName.split('.').pop();
      const machineName = `${section}_${user.id}_${timestamp}_${originalName}`;
      const { data, error } = await supabaseClient.storage.from('files').upload(machineName, f, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) {
        setUploadError(error.message);
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        setUploading(false);
        return;
      }
      const url = supabaseClient.storage.from('files').getPublicUrl(machineName).data.publicUrl;
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
      await supabaseClient.from('files').insert([newFile]);
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

// Add billing and usage types
type BillingEvent = {
  id: string;
  date: string;
  type: 'invoice' | 'payment' | 'usage' | 'user';
  amount?: number;
  currency?: string;
  description: string;
  status?: 'paid' | 'pending' | 'overdue';
  users?: number;
  consumption?: {
    units: number;
    type: string;
  };
};

// Add billing data
const billingData: BillingEvent[] = [
  {
    id: 'billing-1',
    date: '2024-03-15',
    type: 'user',
    users: 5,
    description: 'Initial user setup'
  },
  {
    id: 'billing-2',
    date: '2024-03-20',
    type: 'invoice',
    amount: 2500,
    currency: 'USD',
    description: 'Initial setup invoice',
    status: 'paid'
  },
  {
    id: 'billing-3',
    date: '2024-03-25',
    type: 'usage',
    consumption: {
      units: 1000,
      type: 'API calls'
    },
    description: 'First month usage'
  },
  {
    id: 'billing-4',
    date: '2024-04-01',
    type: 'user',
    users: 8,
    description: 'Additional users added'
  },
  {
    id: 'billing-5',
    date: '2024-04-05',
    type: 'payment',
    amount: 5000,
    currency: 'USD',
    description: 'Monthly subscription payment',
    status: 'paid'
  }
];

// Define types for knowledge base
type KnowledgeBaseItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  notionId: string;
};

type KnowledgeBaseCategory = {
  title: string;
  items: KnowledgeBaseItem[];
};

type KnowledgeBaseCategories = {
  [key: string]: KnowledgeBaseCategory;
};

// Add knowledge base data with categories
const knowledgeBaseCategories: KnowledgeBaseCategories = {
  sales: {
    title: 'Sales Process',
    items: [
      {
        id: 'kb-1',
        title: 'Qualifications',
        description: 'Customer qualification criteria and process',
        icon: '🎯',
        notionId: 'qualifications-123'
      },
      {
        id: 'kb-2',
        title: 'Stage Definition',
        description: 'Sales stages and progression criteria',
        icon: '📊',
        notionId: 'stages-456'
      },
      {
        id: 'kb-7',
        title: 'Core Value Proposition',
        description: 'Key value propositions and benefits',
        icon: '💎',
        notionId: 'value-prop-404'
      },
      {
        id: 'kb-8',
        title: 'Objection Handling',
        description: 'Common objections and response strategies',
        icon: '🛡️',
        notionId: 'objections-505'
      },
      {
        id: 'kb-9',
        title: 'Pricing Strategy',
        description: 'Pricing models and negotiation guidelines',
        icon: '💰',
        notionId: 'pricing-606'
      },
      {
        id: 'kb-10',
        title: 'Competitive Analysis',
        description: 'Competitor comparison and positioning',
        icon: '📈',
        notionId: 'competitors-707'
      }
    ]
  },
  technical: {
    title: 'Technical Resources',
    items: [
      {
        id: 'kb-3',
        title: 'Model Types',
        description: 'Overview of available model types',
        icon: '🤖',
        notionId: 'models-789'
      },
      {
        id: 'kb-4',
        title: 'Current Models in Production',
        description: 'Active models and their use cases',
        icon: '⚡',
        notionId: 'prod-models-101'
      },
      {
        id: 'kb-5',
        title: 'Model API',
        description: 'API documentation and integration guides',
        icon: '🔌',
        notionId: 'api-docs-202'
      },
      {
        id: 'kb-6',
        title: 'On-prem Deployment',
        description: 'On-premises deployment guide',
        icon: '🏢',
        notionId: 'onprem-303'
      },
      {
        id: 'kb-11',
        title: 'Security & Compliance',
        description: 'Security measures and compliance requirements',
        icon: '🔒',
        notionId: 'security-808'
      },
      {
        id: 'kb-12',
        title: 'Performance Benchmarks',
        description: 'Model performance metrics and benchmarks',
        icon: '📊',
        notionId: 'benchmarks-909'
      }
    ]
  },
  customer: {
    title: 'Customer Success',
    items: [
      {
        id: 'kb-13',
        title: 'Implementation Guide',
        description: 'Step-by-step implementation process',
        icon: '🚀',
        notionId: 'implementation-1010'
      },
      {
        id: 'kb-14',
        title: 'Best Practices',
        description: 'Recommended practices and use cases',
        icon: '⭐',
        notionId: 'best-practices-1111'
      },
      {
        id: 'kb-15',
        title: 'Troubleshooting',
        description: 'Common issues and solutions',
        icon: '🔧',
        notionId: 'troubleshooting-1212'
      },
      {
        id: 'kb-16',
        title: 'Training Materials',
        description: 'Customer training resources',
        icon: '📚',
        notionId: 'training-1313'
      }
    ]
  }
};

// Add topic types and data
type Topic = {
  id: string;
  name: string;
  color: string;
};

const topics: Topic[] = [
  { id: 'technical', name: 'Technical', color: 'blue' },
  { id: 'sales', name: 'Sales', color: 'green' },
  { id: 'legal', name: 'Legal', color: 'purple' },
  { id: 'finance', name: 'Finance', color: 'orange' }
];

// Update timeline data to include topics
const timelineData: TimelineItem[] = [
  {
    id: 'timeline-1',
    date: '2024-03-15',
    type: 'status',
    title: 'Opportunity Created',
    description: 'Initial opportunity created by John Smith',
    icon: '🎯',
    topics: ['sales'],
    metadata: {
      createdBy: 'John Smith',
      source: 'CRM Import'
    }
  },
  {
    id: 'timeline-2',
    date: '2024-03-16',
    type: 'email',
    title: 'Initial Outreach',
    description: 'Sent introduction email to Sarah Chen (CTO)',
    icon: '📧',
    topics: ['sales'],
    metadata: {
      recipient: 'Sarah Chen',
      role: 'CTO',
      emailId: 'email-123'
    }
  },
  {
    id: 'timeline-3',
    date: '2024-03-17',
    type: 'granola',
    title: 'Discovery Call',
    description: 'Initial discovery call with Sarah Chen',
    icon: '🎙️',
    topics: ['technical', 'sales'],
    metadata: {
      participants: ['Sarah Chen', 'John Smith', 'Alex Rodriguez'],
      duration: '45m',
      transcriptId: 'granola-456',
      summary: 'Discussed current infrastructure and pain points'
    }
  },
  {
    id: 'timeline-4',
    type: 'slack',
    date: '2024-03-17',
    title: 'Internal Channel Created',
    description: 'Created #acme-enterprise channel',
    icon: '💬',
    topics: ['technical'],
    metadata: {
      channel: 'acme-enterprise',
      type: 'internal',
      members: ['John Smith', 'Alex Rodriguez', 'Maria Garcia']
    }
  },
  {
    id: 'timeline-5',
    type: 'slack',
    date: '2024-03-18',
    title: 'External Channel Created',
    description: 'Created shared channel with ACME team',
    icon: '🤝',
    topics: ['technical', 'sales'],
    metadata: {
      channel: 'acme-partnership',
      type: 'external',
      members: ['Sarah Chen', 'John Smith', 'Alex Rodriguez']
    }
  },
  {
    id: 'timeline-6',
    type: 'notion',
    date: '2024-03-18',
    title: 'Requirements Doc',
    description: 'Created initial requirements document',
    icon: '📝',
    topics: ['technical'],
    metadata: {
      author: 'Alex Rodriguez',
      documentId: 'notion-789',
      status: 'Draft'
    }
  },
  {
    id: 'timeline-7',
    type: 'status',
    date: '2024-03-19',
    title: 'Qualified',
    description: 'Opportunity qualified by sales team',
    icon: '✅',
    topics: ['sales', 'finance'],
    metadata: {
      qualifiedBy: 'John Smith',
      reason: 'Budget approved, technical requirements met'
    }
  }
];

interface Account {
  id: string;
  name: string;
  logoUrl?: string;
  type?: 'new_business' | 'renewal' | 'expansion';
}

interface SidebarProps {
  accounts: Account[];
  onSelect: (account: Account) => void;
  selectedAccountId?: string;
  onAccountCreated?: () => void;
  showDefault?: boolean;
  onShowDefault?: (show: boolean) => void;
}

const FILTERS = [
  { key: 'new_business', label: 'New Business' },
  { key: 'renewal', label: 'Renewals' },
  { key: 'expansion', label: 'Expansion' },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export default function Sidebar({ accounts, onSelect, selectedAccountId, onAccountCreated, showDefault, onShowDefault }: SidebarProps) {
  const [activeFilter, setActiveFilter] = useState<'new_business' | 'renewal' | 'expansion'>('new_business');
  const [showForm, setShowForm] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoaded } = useUser();
  const [teams, setTeams] = useState<Array<{ team_id: string }>>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const { client: supabaseClient, isReady } = useClerkSupabaseAuth();

  useEffect(() => {
    if (!user?.id || !supabaseClient || !isReady) return;
    
    const fetchTeams = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id);
          
        if (error) {
          console.log('Error fetching teams in Sidebar:', error.message);
          return;
        }
        
        setTeams(data || []);
        if (data && data.length > 0) setActiveTeamId(data[0].team_id);
      } catch (err) {
        console.error('Error in fetchTeams:', err);
      }
    };
    
    fetchTeams();
  }, [user?.id, supabaseClient, isReady]);

  const filteredAccounts = accounts.filter(
    (acc) => acc.type === activeFilter
  );

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!activeTeamId || !supabaseClient) {
      setError('No team selected or client not ready.');
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabaseClient
        .from('accounts')
        .insert([{ name: accountName, team_id: activeTeamId }])
        .select();
      if (error) throw error;
      setAccountName('');
      setShowForm(false);
      if (onAccountCreated) onAccountCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-72 h-full bg-[#444444] text-white flex flex-col border-r border-gray-800 shadow-lg">
      {/* Filter Tabs */}
      <div className="flex items-center w-full text-xs font-semibold bg-[#444444] rounded-t-lg border-b border-gray-700" style={{ minHeight: 40 }}>
        <div className="flex h-full w-full">
          {FILTERS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key as typeof activeFilter)}
              className={`relative py-2 px-4 transition-colors border-0 flex-1
                ${activeFilter === tab.key
                  ? 'text-yellow-400 after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-0 after:w-8 after:h-1 after:rounded-full after:bg-yellow-400'
                  : 'text-gray-400 hover:text-yellow-400'}`}
              style={{ minWidth: 90 }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {/* Create Account Button */}
      <div className="p-3 flex items-center justify-between bg-[#444444]">
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold w-full"
          onClick={() => setShowForm(true)}
          disabled={!isLoaded || !activeTeamId}
          title={!isLoaded ? 'Loading user...' : !activeTeamId ? 'No team selected' : ''}
        >
          + Create Account
        </button>
      </div>
      {/* Create Account Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-full text-gray-900">
            <h2 className="text-lg font-bold mb-4">Create Account</h2>
            <form onSubmit={handleCreateAccount} className="flex flex-col gap-3">
              <input
                type="text"
                value={accountName}
                onChange={e => setAccountName(e.target.value)}
                placeholder="Account name"
                className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                disabled={loading || !activeTeamId}
              />
              {error && <span className="text-xs text-red-600">{error}</span>}
              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  disabled={loading || !accountName.trim() || !activeTeamId}
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-sm"
                  onClick={() => { setShowForm(false); setError(null); }}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Accounts List */}
      <div className="flex-1 overflow-y-auto bg-[#444444] p-2">
        <div className="bg-white rounded-lg shadow p-2 flex flex-col h-full">
          {filteredAccounts.length === 0 ? (
            <div className="text-gray-400 text-sm mt-8 text-center">No accounts found.</div>
          ) : (
            <ul className="space-y-2 flex-1 overflow-y-auto">
              {filteredAccounts.map((account) => (
                <li
                  key={account.id}
                  className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors border border-transparent hover:bg-blue-100 text-gray-900 bg-gray-50 ${selectedAccountId === account.id ? 'bg-blue-100 border-yellow-400' : ''}`}
                  onClick={() => onSelect(account)}
                >
                  {account.logoUrl ? (
                    <img src={account.logoUrl} alt={account.name} className="w-8 h-8 rounded-full bg-white object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-yellow-600 flex items-center justify-center font-bold text-[#444444] text-lg">
                      {getInitials(account.name)}
                    </div>
                  )}
                  <span className="font-semibold truncate">{account.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {/* Show Default Project Button */}
      {typeof showDefault !== 'undefined' && typeof onShowDefault === 'function' && (
        <div className="p-3">
          <button
            className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-sm w-full"
            onClick={() => onShowDefault(!showDefault)}
          >
            {showDefault ? 'Hide Default Project' : 'Show Default Project'}
          </button>
        </div>
      )}
    </div>
  );
}
