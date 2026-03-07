/**
 * @file store/project.store.ts
 * @description Zustand store for projects.
 */

import { create } from 'zustand';
import type { Project } from '@/types';

interface ProjectState {
  projects:      Project[];
  isLoading:     boolean;

  setProjects:   (projects: Project[]) => void;
  addProject:    (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;

  setLoading:    (loading: boolean) => void;

  /** Clears all projects from the store (called on logout) */
  clearProjects: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects:  [],
  isLoading: false,

  setProjects: (projects) => set({ projects }),

  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),

  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  removeProject: (id) =>
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),

  setLoading: (isLoading) => set({ isLoading }),

  clearProjects: () => set({ projects: [] }),
}));
