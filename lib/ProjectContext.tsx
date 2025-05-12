import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface File {
  id: string;
  name: string;
  type: 'markdown' | 'json' | 'pdf' | 'docx' | 'xls' | 'doc' | 'jpg' | 'jpeg' | 'png' | 'gif';
  content?: string; // for text files
  url?: string;     // for binary files (link to storage)
  mimeType?: string;
  section?: string;
  mandatory?: boolean;
  sourceUrl?: string;
  createdAt?: number;
  created_by?: string;
  project_id?: string;
}

export interface Project {
  id: string;
  name: string;
  files: File[];
  [key: string]: any;
}

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: React.Dispatch<React.SetStateAction<Project | null>>;
  currentFile: File | null;
  setCurrentFile: React.Dispatch<React.SetStateAction<File | null>>;
}

export const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children, projects }: { children: ReactNode; projects: Project[] }) {
  const [currentProject, setCurrentProject] = useState<Project | null>(projects?.[0] || null);
  const [currentFile, setCurrentFile] = useState<File | null>(currentProject?.files?.[0] || null);

  // When project changes, reset currentFile
  React.useEffect(() => {
    if (currentProject && (!currentFile || !currentProject.files.some((f: File) => f.id === currentFile.id))) {
      setCurrentFile(currentProject.files?.[0] || null);
    }
  }, [currentProject]);

  return (
    <ProjectContext.Provider value={{
      projects,
      currentProject,
      setCurrentProject,
      currentFile,
      setCurrentFile,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within a ProjectProvider');
  return ctx;
} 