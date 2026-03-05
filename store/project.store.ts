import { create } from 'zustand';
import type { Project } from '@/types';

interface ProjectState {
  projects: Project[]; isLoading: boolean; error: string | null;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  clearProjects: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [], isLoading: false, error: null,
  setProjects: (projects) => set({ projects, error: null }),
  addProject: (project) => set((s) => ({ projects: [project, ...s.projects] })),
  updateProject: (id, updates) => set((s) => ({ projects: s.projects.map((p) => p.id === id ? { ...p, ...updates } : p) })),
  removeProject: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearProjects: () => set({ projects: [], error: null }),
}));
