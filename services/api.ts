import axios from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '@/store/auth.store';

const BASE_URL = Platform.select({
  android: 'http://192.168.32.107:3000/api/v1',
  ios:     'http://localhost:3000/api/v1',
  web:     'http://localhost:3000/api/v1',
  default: 'http://localhost:3000/api/v1',
});

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

type FailedReq = { resolve: (t: string) => void; reject: (e: unknown) => void };
let isRefreshing = false;
let queue: FailedReq[] = [];
const flush = (err: unknown, token: string | null) => {
  queue.forEach((p) => (err ? p.reject(err) : p.resolve(token!)));
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status !== 401 || orig._retry) return Promise.reject(error);
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => { queue.push({ resolve, reject }); })
        .then((token) => { orig.headers['Authorization'] = `Bearer ${token}`; return api(orig); });
    }
    orig._retry = true; isRefreshing = true;
    try {
      const { data } = await api.post<{ accessToken: string }>('/auth/refresh');
      useAuthStore.getState().setAccessToken(data.accessToken);
      flush(null, data.accessToken);
      orig.headers['Authorization'] = `Bearer ${data.accessToken}`;
      return api(orig);
    } catch (e) {
      flush(e, null); useAuthStore.getState().logout(); return Promise.reject(e);
    } finally { isRefreshing = false; }
  }
);

export const authApi = {
  register: (d: { name: string; email: string; password: string }) => api.post('/auth/register', d),
  login:    (d: { email: string; password: string })               => api.post('/auth/login', d),
  logout:   ()                                                      => api.post('/auth/logout'),
  me:       ()                                                      => api.get('/auth/me'),
};

export const taskApi = {
  list:          (params?: object)           => api.get('/tasks', { params }),
  get:           (id: string)                => api.get(`/tasks/${id}`),
  create:        (data: object)              => api.post('/tasks', data),
  update:        (id: string, data: object)  => api.patch(`/tasks/${id}`, data),
  toggle:        (id: string)                => api.patch(`/tasks/${id}/toggle`),
  remove:        (id: string)                => api.delete(`/tasks/${id}`),
  addSubtask:    (id: string, title: string) => api.post(`/tasks/${id}/subtasks`, { title }),
  toggleSubtask: (id: string, subId: string) => api.patch(`/tasks/${id}/subtasks/${subId}`),
};

export const projectApi = {
  list:   (params?: object)          => api.get('/projects', { params }),
  get:    (id: string)               => api.get(`/projects/${id}`),
  create: (data: object)             => api.post('/projects', data),
  update: (id: string, data: object) => api.patch(`/projects/${id}`, data),
  remove: (id: string)               => api.delete(`/projects/${id}`),
};

export const userApi = {
  getProfile:        ()             => api.get('/users/me'),
  updateProfile:     (data: object) => api.patch('/users/me', data),
  changePassword:    (data: object) => api.patch('/users/me/password', data),
  updatePreferences: (data: object) => api.patch('/users/me/preferences', data),
};
