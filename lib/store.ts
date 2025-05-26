import { create } from 'zustand';

export type File = {
  id: string;
  name: string;
  type: 'markdown' | 'json' | 'pdf' | 'docx' | 'xls' | 'doc' | 'jpg' | 'jpeg' | 'png' | 'gif';
  content?: string;
  url?: string;
  mimeType?: string;
  section?: string;
  mandatory?: boolean;
  sourceUrl?: string;
  createdAt?: number;
  created_by?: string;
  project_id?: string;
};

export type Project = {
  id: string;
  name: string;
  files: File[];
};

export interface TimelineItem {
  id: string;
  name: string;
  title: string;
  type: string;
  date: string;
  description: string;
}

export interface AppState {
  projects: Project[];
  currentFile: File | null;
  openFiles: File[];
  selectedTimelineEntry: TimelineItem | null;
  setCurrentFile: (file: File | null) => void;
  addFileToProject: (projectId: string, files: File[]) => void;
  openFile: (file: File) => void;
  closeFile: (fileId: string) => void;
  setSelectedTimelineEntry: (entry: TimelineItem | null) => void;
}

const initialProjects: Project[] = [
  {
    id: 'project-1',
    name: 'BIG Deal',
    files: [
      {
        id: 'exec-summary',
        name: 'Executive Summary.md',
        type: 'markdown',
        content: 'Overview of deal, goals, and strategic narrative.',
      },
      {
        id: 'buying-committee',
        name: 'Buying Committee.json',
        type: 'json',
        content: `{
  "Champion": "Emily (Head of Data)",
  "Economic Buyer": "Jon (CFO)",
  "Security": "Ana (CISO)",
  "Procurement": "Sergio"
}`,
      },
      {
        id: 'objections',
        name: 'Common Objections.md',
        type: 'markdown',
        content: '- What if OpenAI changes pricing?\n- How do we keep data private?\n- Why not build it ourselves?',
      },
      {
        id: 'note-1',
        name: 'Note_250509_081501.md',
        type: 'markdown',
        content: 'Summarised demo feedback: Enthusiastic but concerned about latency under load.',
        section: 'Artifacts',
      },
      {
        id: 'note-2',
        name: 'Note_250509_102301.md',
        type: 'markdown',
        content: 'Copilot suggestion: Prioritise integration with Looker.',
        section: 'Artifacts',
      },
      {
        id: 'note-3',
        name: 'Note_250510_071800.md',
        type: 'markdown',
        content: 'Drafted executive summary tailored to CFO\'s language.',
        section: 'Artifacts',
      },
      {
        id: 'legal-tos',
        name: 'Legal_Terms.md',
        type: 'markdown',
        content: 'Standard terms and conditions — 30-day payment, SLA, data protection terms included.',
        section: 'Legals',
      },
      {
        id: 'legal-msa',
        name: 'MSA.md',
        type: 'markdown',
        content: 'Draft MSA received from legal, highlights:\n- Liability cap: 2x\n- Data breach: 5 days notification',
        mandatory: true,
        section: 'Legals',
      },
      {
        id: 'legal-mnda',
        name: 'mNDA.md',
        type: 'markdown',
        content: 'Mutual NDA template. Use for all partners and vendors.',
        section: 'Legals',
      },
      {
        id: 'legal-dpa',
        name: 'DPA.md',
        type: 'markdown',
        content: 'Data Processing Agreement. Required for all data integrations.',
        section: 'Legals',
      },
      {
        id: 'legal-baa',
        name: 'BAA.md',
        type: 'markdown',
        content: 'Business Associate Agreement. Required for healthcare customers (HIPAA).',
        section: 'Legals',
      },
      {
        id: 'timeline-internal',
        name: 'Timeline_InternalPrep.md',
        type: 'markdown',
        content: 'Week 1: Define use case\nWeek 2: Demo + feedback\nWeek 3: Pilot config\nWeek 4: Legal review',
        section: 'Timeline',
      },
      {
        id: 'timeline-client-facing',
        name: 'Timeline_ExternalView.md',
        type: 'markdown',
        content: 'May 1: Pilot Start\nMay 15: Evaluation Call\nMay 22: Legal\nJune 1: Contract Target',
        section: 'Timeline',
      },
      {
        id: 'close-plan',
        name: 'Close Plan.md',
        type: 'markdown',
        content: '## Key Milestones\n- Kickoff\n- Security Review\n- Close',
      },
    ],
  },
];

export const useAppStore = create<AppState>((set, get) => ({
  projects: initialProjects,
  currentFile: null,
  openFiles: [],
  selectedTimelineEntry: null,
  setCurrentFile: (file) => set((state) => {
    if (!file) return { currentFile: null };
    // Open the file if not already open
    const alreadyOpen = state.openFiles.some(f => f.id === file.id);
    return {
      currentFile: file,
      openFiles: alreadyOpen ? state.openFiles : [...state.openFiles, file],
    };
  }),
  addFileToProject: (projectId, files) =>
    set((state) => {
      const projects = state.projects.map((p) =>
        p.id === projectId ? { ...p, files: [...p.files, ...files] } : p
      );
      // Also open the new files
      return {
        projects,
        currentFile: files[files.length - 1],
        openFiles: [...state.openFiles, ...files],
      };
    }),
  openFile: (file) => set((state) => {
    if (state.openFiles.some(f => f.id === file.id)) return {};
    return { openFiles: [...state.openFiles, file] };
  }),
  closeFile: (fileId) => set((state) => {
    const openFiles = state.openFiles.filter(f => f.id !== fileId);
    let currentFile = state.currentFile;
    if (currentFile && currentFile.id === fileId) {
      currentFile = openFiles.length > 0 ? openFiles[openFiles.length - 1] : null;
    }
    return { openFiles, currentFile };
  }),
  setSelectedTimelineEntry: (entry) => set({ selectedTimelineEntry: entry }),
}));
