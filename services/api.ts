/**
 * @file services/api.ts

 */
import { Platform } from 'react-native';
import { useAuthStore } from '@/store/auth.store';
import { useTaskStore } from '@/store/task.store';
import { useProjectStore } from '@/store/project.store';
import type { Task, Project, SubTask, User, AuthResponse } from '@/types';

// ─── Response Types ───────────────────────────────────────────────────────────

export interface TaskListResponse {
    data: Task[];
    message: string;
}

export interface TaskResponse {
    data: Task;
    message?: string;
}

export interface ProjectListResponse {
    data: Project[];
    message: string;
}

export interface ProjectResponse {
    data: Project;
    message?: string;
}

export interface SubTaskResponse {
    data: SubTask;
    message?: string;
}

export interface UserResponse {
    user: User;
    message?: string;
}

export interface MessageResponse {
    message: string;
}

export interface RefreshResponse {
  message: string;
  accessToken: string;
}

// ─── Base URL ─────────────────────────────────────────────────────────────────

const NGROK_URL = 'https://unrepeatable-squarrose-leanna.ngrok-free.dev';
const LAN_IP = '';

function getBaseUrl(): string {
    if (NGROK_URL) return `${NGROK_URL}/api/v1`;
    if (LAN_IP) return `http://${LAN_IP}:3000/api/v1`;
    return Platform.select({
        android: 'http://10.0.2.2:3000/api/v1',
        ios: 'http://localhost:3000/api/v1',
        web: 'http://192.168.32.107:3000/api/v1',
        default: 'http://localhost:3000/api/v1',
    })!;
}

const BASE_URL = getBaseUrl();

// ─── Shared fetch helper ──────────────────────────────────────────────────────

async function apiFetch<T>(
    path: string,
    options?: RequestInit,
    ): Promise<T> {
    const token = useAuthStore.getState().accessToken;
    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers ?? {}),
        },
        credentials: 'include',
    });

    const data = (await response.json()) as T;
    if (!response.ok) {
        throw new Error(
        (data as unknown as { message?: string }).message ?? 'Request failed',
        );
    }
    return data;
}

// ─── API Namespace Objects ────────────────────────────────────────────────────

export const authApi = {
    login: ({ email, password }: { email: string; password: string }) =>
        login(email, password),
    register: ({
        name,
        email,
        password,
    }: {
        name: string;
        email: string;
        password: string;
        }) => register(name, email, password),
    
    refresh: () => refreshToken(),
    me: () => getMe(),
    logout: () => logout(),
};

export const taskApi = {
  list: (filters?: Record<string, string>) => getTasks(filters),
  get: (id: string) => getTaskById(id),
  create: (data: Record<string, unknown>) => createTask(data),
  update: (id: string, data: Record<string, unknown>) => updateTask(id, data),
  toggle: (id: string) => toggleTask(id),
  remove: (id: string) => deleteTask(id),
  addSubtask: (taskId: string, title: string) => addSubtask(taskId, title),
  toggleSubtask: (taskId: string, subTaskId: string) =>
    toggleSubtask(taskId, subTaskId),
};

export const projectApi = {
  list: () => getProjects(),
  get: (id: string) => getProjectById(id),
  create: (data: { name: string; color: string; emoji?: string }) =>
    createProject(data),
  update: (
    id: string,
    data: Partial<{ name: string; color: string; emoji: string }>,
  ) => updateProject(id, data),
  remove: (id: string) => deleteProject(id),
};

export const userApi = {
  updateProfile: (data: { name?: string; email?: string }) =>
    updateProfile(data),
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) => changePassword(data),
  updatePreferences: (data: {
    darkMode?: boolean;
    accentTheme?: string;
    avatarColor?: string;
  }) => updatePreferences(data),
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const register = async (
    name: string,
    email: string,
    password: string,
    ): Promise<AuthResponse> => {
    const data = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
    });
    useAuthStore.getState().setAuth(data.user, data.accessToken);
    return data;
};

export const login = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  const data = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  useAuthStore.getState().setAuth(data.user, data.accessToken);
  return data;
};

export const logout = async (): Promise<MessageResponse> => {
  try {
    const data = await apiFetch<MessageResponse>('/auth/logout', {
      method: 'POST',
    });
    return data;
  } finally {
    // Always clear local state on logout, even if request fails
    useAuthStore.getState().logout();
    useTaskStore.getState().clearTasks();
    useProjectStore.getState().clearProjects();
  }
};

export const refreshToken = async (): Promise<RefreshResponse> => {
  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    credentials: 'include',
  });
  const data = (await response.json()) as RefreshResponse;
  if (!response.ok) {
    useAuthStore.getState().logout();
    throw new Error('Refresh failed');
  }
  useAuthStore.getState().setAccessToken(data.accessToken);
  return data;
};

export const getMe = async (): Promise<{ user: User }> => {
  const data = await apiFetch<{ user: User }>('/auth/me');
  useAuthStore.getState().updateUser(data.user);
  return data;
};

// ─── Tasks ────────────────────────────────────────────────────────────────────

/**
 * Fetches the full task list and writes it to the store.
 * This is the only task api function that mutates the store directly —
 * it owns the canonical "load all tasks" flow.
 */
export const getTasks = async (
  filters?: Record<string, string>,
): Promise<TaskListResponse> => {
  useTaskStore.getState().setLoading(true);
  try {
    const queryString = filters
      ? '?' + new URLSearchParams(filters).toString()
      : '';
    const data = await apiFetch<TaskListResponse>(`/tasks${queryString}`);

    // FIX: filter out any null/undefined entries before writing to store
    const safeTasks = (data.data ?? []).filter(Boolean) as Task[];
    useTaskStore.getState().setTasks(safeTasks);
    return { ...data, data: safeTasks };
  } finally {
    useTaskStore.getState().setLoading(false);
  }
};

export const getTaskById = async (taskId: string): Promise<TaskResponse> => {
  return apiFetch<TaskResponse>(`/tasks/${taskId}`);
};

/**
 * Creates a task on the server and returns the response.
 * The CALLING SCREEN is responsible for calling addTask() on the store.
 * FIX: removed the internal addTask() call that caused duplicate keys.
 */
export const createTask = async (
  taskData: Record<string, unknown>,
): Promise<TaskResponse> => {
  return apiFetch<TaskResponse>('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
};

/**
 * Updates a task on the server and returns the response.
 * The calling screen handles updating the store.
 */
export const updateTask = async (
  taskId: string,
  taskData: Record<string, unknown>,
): Promise<TaskResponse> => {
  return apiFetch<TaskResponse>(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(taskData),
  });
};

/**
 * Toggles a task's status on the server.
 * FIX: removed internal toggleTask() store call — the screens apply
 * their own optimistic update before calling this function, so calling
 * toggleTask() here too was cycling the status twice.
 */
export const toggleTask = async (taskId: string): Promise<TaskResponse> => {
  return apiFetch<TaskResponse>(`/tasks/${taskId}/toggle`, {
    method: 'PATCH',
  });
};

/**
 * Deletes a task on the server.
 * FIX: removed internal removeTask() store call — the screens handle removal.
 */
export const deleteTask = async (taskId: string): Promise<MessageResponse> => {
  return apiFetch<MessageResponse>(`/tasks/${taskId}`, {
    method: 'DELETE',
  });
};

export const addSubtask = async (
  taskId: string,
  title: string,
): Promise<SubTaskResponse> => {
  return apiFetch<SubTaskResponse>(`/tasks/${taskId}/subtasks`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
};

export const toggleSubtask = async (
  taskId: string,
  subTaskId: string,
): Promise<SubTaskResponse> => {
  return apiFetch<SubTaskResponse>(`/tasks/${taskId}/subtasks/${subTaskId}`, {
    method: 'PATCH',
  });
};

// ─── Projects ─────────────────────────────────────────────────────────────────

/**
 * Fetches the full project list and writes it to the store.
 * Only project api function that mutates the store directly.
 */
export const getProjects = async (): Promise<ProjectListResponse> => {
  useProjectStore.getState().setLoading(true);
  try {
    const data = await apiFetch<ProjectListResponse>('/projects');
    const safeProjects = (data.data ?? []).filter(Boolean) as Project[];
    useProjectStore.getState().setProjects(safeProjects);
    return { ...data, data: safeProjects };
  } finally {
    useProjectStore.getState().setLoading(false);
  }
};

export const getProjectById = async (
  projectId: string,
): Promise<ProjectResponse> => {
  return apiFetch<ProjectResponse>(`/projects/${projectId}`);
};

/**
 * Creates a project on the server.
 * FIX: removed internal addProject() store call — the calling screen handles it.
 */
export const createProject = async (projectData: {
  name: string;
  color: string;
  emoji?: string;
}): Promise<ProjectResponse> => {
  return apiFetch<ProjectResponse>('/projects', {
    method: 'POST',
    body: JSON.stringify(projectData),
  });
};

export const updateProject = async (
  projectId: string,
  projectData: Partial<{ name: string; color: string; emoji: string }>,
): Promise<ProjectResponse> => {
  return apiFetch<ProjectResponse>(`/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(projectData),
  });
};

/**
 * Deletes a project on the server.
 * FIX: removed internal removeProject() store call — the calling screen handles it.
 */
export const deleteProject = async (
  projectId: string,
): Promise<MessageResponse> => {
  return apiFetch<MessageResponse>(`/projects/${projectId}`, {
    method: 'DELETE',
  });
};

// ─── User ─────────────────────────────────────────────────────────────────────

export const updateProfile = async (profileData: {
  name?: string;
  email?: string;
}): Promise<UserResponse> => {
  const data = await apiFetch<UserResponse>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(profileData),
  });
  useAuthStore.getState().updateUser(data.user);
  return data;
};

export const changePassword = async (passwordData: {
  currentPassword: string;
  newPassword: string;
}): Promise<MessageResponse> => {
  return apiFetch<MessageResponse>('/users/me/password', {
    method: 'PATCH',
    body: JSON.stringify(passwordData),
  });
};

export const updatePreferences = async (prefData: {
  darkMode?: boolean;
  accentTheme?: string;
  avatarColor?: string;
}): Promise<UserResponse> => {
  const data = await apiFetch<UserResponse>('/users/me/preferences', {
    method: 'PATCH',
    body: JSON.stringify(prefData),
  });
  useAuthStore.getState().updateUser(data.user);
  return data;
};