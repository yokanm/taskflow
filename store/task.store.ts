import { create } from 'zustand';
import type { Task } from '@/types';

interface TaskState {
  tasks: Task[]; isLoading: boolean; error: string | null;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  toggleTask: (id: string) => void;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  clearTasks: () => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [], isLoading: false, error: null,
  setTasks: (tasks) => set({ tasks, error: null }),
  addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),
  updateTask: (id, updates) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, ...updates } : t) })),
  removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
  toggleTask: (id) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, status: t.status === 'DONE' ? 'TODO' : 'DONE' } : t) })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearTasks: () => set({ tasks: [], error: null }),
}));
