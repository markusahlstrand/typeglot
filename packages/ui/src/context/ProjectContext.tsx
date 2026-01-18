import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, type Project } from '../api/client';

interface ProjectContextValue {
  /** List of all discovered projects */
  projects: Project[];
  /** Currently selected project */
  currentProject: Project | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Switch to a different project */
  switchProject: (projectId: string) => Promise<void>;
  /** Refresh the projects list */
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [projectList, current] = await Promise.all([
        api.getProjects(),
        api.getCurrentProject().catch(() => null),
      ]);
      setProjects(projectList);
      setCurrentProject(current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchProject = useCallback(async (projectId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const project = await api.setCurrentProject(projectId);
      setCurrentProject(project);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch project');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        isLoading,
        error,
        switchProject,
        refreshProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
