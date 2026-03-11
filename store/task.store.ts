/**
 * @file store/task.store.ts
 * @description Zustand store for tasks.
 * Supports cycling status: TODO → IN_PROGRESS → DONE → TODO
 */

import { create } from 'zustand';
import type { Task, TaskStatus } from '@/types';

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'DONE',
  DONE: 'TODO',
};

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  /** Cycles status: TODO → IN_PROGRESS → DONE → TODO */
  toggleTask: (id: string) => void;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  clearTasks: () => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  isLoading: false,
  error: null,

  setTasks: (tasks) => set({ tasks: tasks ?? [], error: null }),

  addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),

  updateTask: (id, updates) =>
    set((s) => ({
      tasks: s.tasks.map((task) => (task.id === id ? { ...task, ...updates } : task)),
    })),

  removeTask: (id) =>
    set((s) => ({ tasks: s.tasks.filter((task) => task.id !== id) })),

  toggleTask: (id) =>
    set((s) => ({
      tasks: s.tasks.map((task) =>
        task.id === id
          ? { ...task, status: STATUS_CYCLE[task.status] ?? 'TODO' }
          : task
      ),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearTasks: () => set({ tasks: [], error: null }),
}));