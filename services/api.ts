/**
 * @file services/api.ts  (task update section only - patch)
 * Key addition: taskApi.update() now works correctly for edit mode.
 * The toggle endpoint on the backend only does DONE ↔ TODO;
 * to support IN_PROGRESS we use update() instead for that transition.
 */

import { Platform } from 'react-native';
import { useAuthStore } from '@/store/auth.store';

const NGROK_URL = 'https://unrepeatable-squarrose-leanna.ngrok-free.dev';
const LAN_IP = '';

function getBaseUrl(): string {
  if (NGROK_URL) return `${NGROK_URL}/api/v1`;
  if (LAN_IP)    return `http://${LAN_IP}:3000/api/v1`;
  return Platform.select({
    android: 'http://10.0.2.2:3000/api/v1',
    ios:     'http://localhost:3000/api/v1',
    web:     'http://192.168.32.107:3000/api/v1',
    default: 'http://localhost:3000/api/v1',
  })!;
}

const BASE_URL = getBaseUrl();

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject:  (error: unknown) => void;
}> = [];

function flushQueue(error: unknown, token: string | null): void {
  for (const item of refreshQueue) {
    error ? item.reject(error) : item.resolve(token!);
  }
  refreshQueue = [];
}

async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url   = `${BASE_URL}${path}`;
  const token = useAuthStore.getState().accessToken;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const response = await fetch(url, { ...options, headers, credentials: 'include' });

  if (response.ok) {
    if (response.status === 204) return {} as T;
    return response.json() as Promise<T>;
  }

  if (response.status === 401) {
    if (isRefreshing) {
      return new Promise<T>((resolve, reject) => {
        refreshQueue.push({
          resolve: async (newToken) => {
            try   { resolve(await retryWithToken<T>(path, options, newToken)); }
            catch (e) { reject(e); }
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        credentials: 'include',
      });
      if (!refreshRes.ok) throw new Error('Session expired. Please sign in again.');
      const { accessToken: newToken } = await refreshRes.json() as { accessToken: string };
      useAuthStore.getState().setAccessToken(newToken);
      flushQueue(null, newToken);
      return retryWithToken<T>(path, options, newToken);
    } catch (e) {
      flushQueue(e, null);
      useAuthStore.getState().logout();
      throw e;
    } finally {
      isRefreshing = false;
    }
  }

  let message = `Request failed (${response.status})`;
  try {
    const body = (await response.json()) as { message?: string };
    if (body.message) message = body.message;
  } catch { /* body wasn't JSON */ }
  throw new Error(message);
}

async function retryWithToken<T>(path: string, options: RequestInit, token: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string> | undefined),
    },
    credentials: 'include',
  });
  if (response.ok) {
    if (response.status === 204) return {} as T;
    return response.json() as Promise<T>;
  }
  let message = `Request failed (${response.status})`;
  try { const b = (await response.json()) as { message?: string }; if (b.message) message = b.message; } catch { /* empty */ }
  throw new Error(message);
}

const api = {
  get:    <T>(path: string)                 => apiFetch<T>(path, { method: 'GET' }),
  post:   <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'POST',   body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch:  <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'PATCH',  body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string)                 => apiFetch<T>(path, { method: 'DELETE' }),
};

export interface AuthUserShape {
  id: string; name: string; email: string;
  avatarColor: string; accentTheme: string; darkMode: boolean; createdAt: string;
}
export interface AuthLoginResponse   { message: string; accessToken: string; user: AuthUserShape; }
export interface AuthMeResponse      { user: AuthUserShape; }
export interface AuthRefreshResponse { message: string; accessToken: string; }
export interface MessageResponse     { message: string; }
export interface UserResponse        { user: AuthUserShape; message?: string; }

import type { Task, Project, SubTask } from '@/types';
export interface TaskListResponse    { data: Task[];    message: string; }
export interface TaskResponse        { data: Task;      message?: string; }
export interface ProjectListResponse { data: Project[]; message: string; }
export interface ProjectResponse     { data: Project;   message?: string; }
export interface SubTaskResponse     { data: SubTask;   message?: string; }

export const authApi = {
  register: (d: { name: string; email: string; password: string }) =>
    api.post<AuthLoginResponse>('/auth/register', d),
  login:   (d: { email: string; password: string }) =>
    api.post<AuthLoginResponse>('/auth/login', d),
  logout:  () => api.post<MessageResponse>('/auth/logout'),
  refresh: () => api.post<AuthRefreshResponse>('/auth/refresh'),
  me:      () => api.get<AuthMeResponse>('/auth/me'),
};

export const taskApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<TaskListResponse>(`/tasks${query}`);
  },
  get:           (id: string)                              => api.get<TaskResponse>(`/tasks/${id}`),
  create:        (data: Record<string, unknown>)           => api.post<TaskResponse>('/tasks', data),
  update:        (id: string, data: Record<string, unknown>) => api.patch<TaskResponse>(`/tasks/${id}`, data),
  /**
   * Toggle cycles status on the server: TODO ↔ DONE.
   * For IN_PROGRESS, the create screen uses update() directly.
   * The client-side store cycles TODO → IN_PROGRESS → DONE → TODO,
   * then syncs the real server status from the response.
   */
  toggle:        (id: string)                              => api.patch<TaskResponse>(`/tasks/${id}/toggle`),
  remove:        (id: string)                              => api.delete<MessageResponse>(`/tasks/${id}`),
  addSubtask:    (taskId: string, title: string)           => api.post<SubTaskResponse>(`/tasks/${taskId}/subtasks`, { title }),
  toggleSubtask: (taskId: string, subId: string)           => api.patch<SubTaskResponse>(`/tasks/${taskId}/subtasks/${subId}`),
};

export const projectApi = {
  list:   ()                                                                           => api.get<ProjectListResponse>('/projects'),
  get:    (id: string)                                                                 => api.get<ProjectResponse>(`/projects/${id}`),
  create: (data: { name: string; color: string; emoji?: string })                     => api.post<ProjectResponse>('/projects', data),
  update: (id: string, data: Partial<{ name: string; color: string; emoji: string }>) => api.patch<ProjectResponse>(`/projects/${id}`, data),
  remove: (id: string)                                                                 => api.delete<MessageResponse>(`/projects/${id}`),
};

export const userApi = {
  getProfile:        ()                                                                          => api.get<UserResponse>('/users/me'),
  updateProfile:     (data: { name?: string; email?: string })                                  => api.patch<UserResponse>('/users/me', data),
  changePassword:    (data: { currentPassword: string; newPassword: string })                   => api.patch<MessageResponse>('/users/me/password', data),
  updatePreferences: (data: { darkMode?: boolean; accentTheme?: string; avatarColor?: string }) => api.patch<UserResponse>('/users/me/preferences', data),
};
