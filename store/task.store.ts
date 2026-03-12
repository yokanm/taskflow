/**
 * @file store/task.store.ts
 * @description Zustand store for tasks.
 *
 * FIXES:
 * 1. setTasks now filters out null/undefined entries — prevents downstream
 *    "Cannot read property X of undefined" errors if the API ever returns
 *    a malformed payload.
 * 2. toggleTask uses a lookup with explicit fallback to prevent cycling to
 *    an unknown status if task.status is somehow unexpected.
 * 3. addTask guards against adding undefined/null tasks.
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
  /** Cycles status: TODO → IN_PROGRESS → DONE → TODO (optimistic update) */
  toggleTask: (id: string) => void;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  clearTasks: () => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  isLoading: false,
  error: null,

  // FIX: filter out null/undefined entries to prevent downstream crashes
  setTasks: (tasks) =>
    set({ tasks: (tasks ?? []).filter(Boolean) as Task[], error: null }),

  // FIX: guard against adding undefined/null task
  addTask: (task) => {
    if (!task) return;
    set((s) => ({ tasks: [task, ...s.tasks] }));
  },

  updateTask: (id, updates) =>
    set((s) => ({
      tasks: s.tasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task,
      ),
    })),

  removeTask: (id) =>
    set((s) => ({ tasks: s.tasks.filter((task) => task.id !== id) })),

  // Cycles status optimistically — server response reconciles the final state
  toggleTask: (id) =>
    set((s) => ({
      tasks: s.tasks.map((task) => {
        if (task.id !== id) return task;
        const next = STATUS_CYCLE[task.status];
        return next ? { ...task, status: next } : task;
      }),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearTasks: () => set({ tasks: [], error: null }),
}));