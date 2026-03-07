/**
 * @file services/api.ts
 * @description Central API client for TaskFlow using the native Fetch API.
 *
 * Key behaviours:
 *  - Reads the current access token from Zustand on every request
 *  - On 401, calls /auth/refresh once; queues parallel requests so only
 *    one refresh ever fires at a time
 *  - If refresh fails, logs the user out and rejects all queued requests
 *  - Every endpoint is typed with its exact server response shape
 *  - Throws a plain Error whose .message is taken from the server JSON
 */

import { Platform } from 'react-native';
import { useAuthStore } from '@/store/auth.store';

// ─── Base URL ─────────────────────────────────────────────────────────────────
/**
 * HOW TO CONFIGURE FOR YOUR ENVIRONMENT:
 *
 * Option A — ngrok (recommended for physical devices, both iOS and Android):
 *   Set NGROK_URL to your full ngrok https URL (no trailing slash, no port).
 *   e.g. 'https://unrepeatable-squarrose-leanna.ngrok-free.dev'
 *   ngrok already handles the port mapping, so do NOT append :3000.
 *
 * Option B — Local network IP (physical device on same Wi-Fi):
 *   Set LAN_IP to your dev machine's local IP (run `ipconfig` / `ifconfig`).
 *   e.g. '192.168.1.42'
 *   The http://<LAN_IP>:3000 URL will be used.
 *
 * Option C — Emulator only:
 *   Android emulator: 10.0.2.2 maps to host localhost — works automatically.
 *   iOS simulator: localhost works directly — works automatically.
 *   Leave NGROK_URL empty and LAN_IP empty to use emulator defaults.
 */

/** Set this to your ngrok URL to use it on ALL platforms (overrides everything else) */
const NGROK_URL = 'https://unrepeatable-squarrose-leanna.ngrok-free.dev'; // ← your ngrok URL

/** Set this to your LAN IP for physical-device testing without ngrok */
const LAN_IP = ''; // e.g. '192.168.1.42' — leave empty if using ngrok or emulator

function getBaseUrl(): string {
  // If a ngrok URL is configured, use it everywhere (simplest setup)
  if (NGROK_URL) {
    // ngrok already proxies port 3000 → 443, so never append :3000
    return `${NGROK_URL}/api/v1`;
  }

  // Physical device on LAN (no ngrok)
  if (LAN_IP) {
    return `http://${LAN_IP}:3000/api/v1`;
  }

  // Emulator / simulator defaults
  return Platform.select({
    android: 'http://10.0.2.2:3000/api/v1',   // Android emulator → host localhost
    ios:     'http://localhost:3000/api/v1',    // iOS simulator
    web:     'http://192.168.32.107:3000/api/v1',
    default: 'http://localhost:3000/api/v1',
  })!;
}

const BASE_URL = getBaseUrl();

// ─── Refresh queue ────────────────────────────────────────────────────────────
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

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function apiFetch<T = unknown>(
  path:    string,
  options: RequestInit = {},
): Promise<T> {
  const url   = `${BASE_URL}${path}`;
  const token = useAuthStore.getState().accessToken;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // ngrok free tier shows a browser warning page — this header bypasses it
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
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
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

  // Parse error message from server body
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
      Authorization:  `Bearer ${token}`,
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

// ─── HTTP verb helpers ────────────────────────────────────────────────────────
const api = {
  get:    <T>(path: string)                  => apiFetch<T>(path, { method: 'GET' }),
  post:   <T>(path: string, body?: unknown)  => apiFetch<T>(path, { method: 'POST',   body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch:  <T>(path: string, body?: unknown)  => apiFetch<T>(path, { method: 'PATCH',  body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string)                  => apiFetch<T>(path, { method: 'DELETE' }),
};

// ─── Response types (matching exact server shapes) ────────────────────────────
export interface AuthUserShape {
  id: string; name: string; email: string;
  avatarColor: string; accentTheme: string; darkMode: boolean; createdAt: string;
}
export interface AuthLoginResponse  { message: string; accessToken: string; user: AuthUserShape; }
export interface AuthMeResponse     { user: AuthUserShape; }
export interface AuthRefreshResponse{ message: string; accessToken: string; }
export interface MessageResponse    { message: string; }
export interface UserResponse       { user: AuthUserShape; message?: string; }

import type { Task, Project, SubTask } from '@/types';
export interface TaskListResponse    { data: Task[];    message: string; }
export interface TaskResponse        { data: Task;      message?: string; }
export interface ProjectListResponse { data: Project[]; message: string; }
export interface ProjectResponse     { data: Project;   message?: string; }
export interface SubTaskResponse     { data: SubTask;   message?: string; }

// ─── Auth endpoints ───────────────────────────────────────────────────────────
export const authApi = {
  register: (d: { name: string; email: string; password: string }) =>
    api.post<AuthLoginResponse>('/auth/register', d),

  login: (d: { email: string; password: string }) =>
    api.post<AuthLoginResponse>('/auth/login', d),

  logout: () => api.post<MessageResponse>('/auth/logout'),

  refresh: () => api.post<AuthRefreshResponse>('/auth/refresh'),

  me: () => api.get<AuthMeResponse>('/auth/me'),
};

// ─── Task endpoints ───────────────────────────────────────────────────────────
export const taskApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<TaskListResponse>(`/tasks${query}`);
  },
  get:           (id: string)                              => api.get<TaskResponse>(`/tasks/${id}`),
  create:        (data: Record<string, unknown>)           => api.post<TaskResponse>('/tasks', data),
  update:        (id: string, data: Record<string, unknown>) => api.patch<TaskResponse>(`/tasks/${id}`, data),
  toggle:        (id: string)                              => api.patch<TaskResponse>(`/tasks/${id}/toggle`),
  remove:        (id: string)                              => api.delete<MessageResponse>(`/tasks/${id}`),
  addSubtask:    (taskId: string, title: string)           => api.post<SubTaskResponse>(`/tasks/${taskId}/subtasks`, { title }),
  toggleSubtask: (taskId: string, subId: string)           => api.patch<SubTaskResponse>(`/tasks/${taskId}/subtasks/${subId}`),
};

// ─── Project endpoints ────────────────────────────────────────────────────────
export const projectApi = {
  list:   ()                                                                           => api.get<ProjectListResponse>('/projects'),
  get:    (id: string)                                                                 => api.get<ProjectResponse>(`/projects/${id}`),
  create: (data: { name: string; color: string; emoji?: string })                     => api.post<ProjectResponse>('/projects', data),
  update: (id: string, data: Partial<{ name: string; color: string; emoji: string }>) => api.patch<ProjectResponse>(`/projects/${id}`, data),
  remove: (id: string)                                                                 => api.delete<MessageResponse>(`/projects/${id}`),
};

// ─── User endpoints ───────────────────────────────────────────────────────────
export const userApi = {
  getProfile:        ()                                                                          => api.get<UserResponse>('/users/me'),
  updateProfile:     (data: { name?: string; email?: string })                                  => api.patch<UserResponse>('/users/me', data),
  changePassword:    (data: { currentPassword: string; newPassword: string })                   => api.patch<MessageResponse>('/users/me/password', data),
  updatePreferences: (data: { darkMode?: boolean; accentTheme?: string; avatarColor?: string }) => api.patch<UserResponse>('/users/me/preferences', data),
};