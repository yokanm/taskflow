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

// ─── URL ──────────────────────────────────────────────────────────────────────

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

// ─── API Namespace Objects ────────────────────────────────────────────────────

export const authApi = {
    login:    ({ email, password }: { email: string; password: string }) =>
                  login(email, password),
    register: ({ name, email, password }: { name: string; email: string; password: string }) =>
                  register(name, email, password),
    refresh:  () => refreshToken(),
    me:       () => getMe(),
    logout:   () => logout(),
};

export const taskApi = {
    list:          (filters?: Record<string, string>) => getTasks(filters),
    get:           (id: string)                        => getTaskById(id),
    create:        (data: Record<string, unknown>)     => createTask(data),
    update:        (id: string, data: Record<string, unknown>) => updateTask(id, data),
    toggle:        (id: string)                        => toggleTask(id),
    remove:        (id: string)                        => deleteTask(id),
    addSubtask:    (taskId: string, title: string)     => addSubtask(taskId, title),
    toggleSubtask: (taskId: string, subTaskId: string) => toggleSubtask(taskId, subTaskId),
};

export const projectApi = {
    list:   ()                                                                          => getProjects(),
    get:    (id: string)                                                                => getProjectById(id),
    create: (data: { name: string; color: string; emoji?: string })                    => createProject(data),
    update: (id: string, data: Partial<{ name: string; color: string; emoji: string }>) => updateProject(id, data),
    remove: (id: string)                                                                => deleteProject(id),
};

export const userApi = {
    updateProfile:     (data: { name?: string; email?: string })                                  => updateProfile(data),
    changePassword:    (data: { currentPassword: string; newPassword: string })                   => changePassword(data),
    updatePreferences: (data: { darkMode?: boolean; accentTheme?: string; avatarColor?: string }) => updatePreferences(data),
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const register = async (name: string, email: string, password: string): Promise<AuthResponse> => {
    try {
        const response = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
            credentials: 'include',
            body: JSON.stringify({ name, email, password }),
        });
        const data = await response.json() as AuthResponse;
        if (!response.ok) {
            throw new Error((data as unknown as { message?: string }).message ?? 'Registration failed');
        }
        useAuthStore.getState().setAuth(data.user, data.accessToken);
        return data;
    } catch (error) {
        console.error('Register error:', error);
        throw error;
    }
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json() as AuthResponse;
        if (!response.ok) {
            throw new Error((data as unknown as { message?: string }).message ?? 'Login failed');
        }
        useAuthStore.getState().setAuth(data.user, data.accessToken);
        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

export const logout = async (): Promise<MessageResponse> => {
    try {
        const response = await fetch(`${BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
            credentials: 'include',
        });
        const data = await response.json() as MessageResponse;
        useAuthStore.getState().logout();
        useTaskStore.getState().clearTasks();
        useProjectStore.getState().clearProjects();
        return data;
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
};

export const refreshToken = async (): Promise<RefreshResponse> => {
    try {
        const response = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
            credentials: 'include',
        });
        const data = await response.json() as RefreshResponse;
        if (response.ok) {
            useAuthStore.getState().setAccessToken(data.accessToken);
        } else {
            useAuthStore.getState().logout();
            throw new Error('Refresh failed');
        }
        return data;
    } catch (error) {
        console.error('Refresh token error:', error);
        throw error;
    }
};

export const getMe = async (): Promise<{ user: User }> => {
    try {
        const token = useAuthStore.getState().accessToken;
        const response = await fetch(`${BASE_URL}/auth/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
        });
        const data = await response.json() as { user: User };
        useAuthStore.getState().updateUser(data.user);
        return data;
    } catch (error) {
        console.error('Get me error:', error);
        throw error;
    }
};

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const getTasks = async (filters?: Record<string, string>): Promise<TaskListResponse> => {
    try {
        const token = useAuthStore.getState().accessToken;
        const queryString = filters ? '?' + new URLSearchParams(filters).toString() : '';
        useTaskStore.getState().setLoading(true);
        const response = await fetch(`${BASE_URL}/tasks${queryString}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
        });
        const data = await response.json() as TaskListResponse;
        useTaskStore.getState().setTasks(data.data);
        useTaskStore.getState().setLoading(false);
        return data;
    } catch (error) {
        useTaskStore.getState().setLoading(false);
        console.error('Get tasks error:', error);
        throw error;
    }
};

export const getTaskById = async (taskId: string): Promise<TaskResponse> => {
    try {
        const token = useAuthStore.getState().accessToken;
        const response = await fetch(`${BASE_URL}/tasks/${taskId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
        });
        const data = await response.json() as TaskResponse;
        return data;
    } catch (error) {
        console.error('Get task error:', error);
        throw error;
    }
};

export const createTask = async (taskData: Record<string, unknown>): Promise<TaskResponse> => {
    try {
        const token = useAuthStore.getState().accessToken;
        const response = await fetch(`${BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
            body: JSON.stringify(taskData),
        });
        const data = await response.json() as TaskResponse;
        useTaskStore.getState().addTask(data.data);
        return data;
    } catch (error) {
        console.error('Create task error:', error);
        throw error;
    }
};

export const updateTask = async (taskId: string, taskData: Record<string, unknown>): Promise<TaskResponse> => {
    try {
        const token = useAuthStore.getState().accessToken;
        const response = await fetch(`${BASE_URL}/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
            body: JSON.stringify(taskData),
        });
        const data = await response.json() as TaskResponse;
        useTaskStore.getState().updateTask(taskId, data.data);
        return data;
    } catch (error) {
        console.error('Update task error:', error);
        throw error;
    }
};

export const toggleTask = async (taskId: string): Promise<TaskResponse> => {
    try {
        const token = useAuthStore.getState().accessToken;
        useTaskStore.getState().toggleTask(taskId);
        const response = await fetch(`${BASE_URL}/tasks/${taskId}/toggle`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
        });
        const data = await response.json() as TaskResponse;
        useTaskStore.getState().updateTask(taskId, data.data);
        return data;
    } catch (error) {
        console.error('Toggle task error:', error);
        throw error;
    }
};

export const deleteTask = async (taskId: string): Promise<MessageResponse> => {
    try {
        const token = useAuthStore.getState().accessToken;
        const response = await fetch(`${BASE_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
        });
        const data = await response.json() as MessageResponse;
        useTaskStore.getState().removeTask(taskId);
        return data;
    } catch (error) {
        console.error('Delete task error:', error);
        throw error;
    }
};

export const addSubtask = async (taskId: string, title: string): Promise<SubTaskResponse> => {
    try {
        const token = useAuthStore.getState().accessToken;
        const response = await fetch(`${BASE_URL}/tasks/${taskId}/subtasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
            body: JSON.stringify({ title }),
        });
        const data = await response.json() as SubTaskResponse;
        useTaskStore.getState().updateTask(taskId, {
            subTasks: [
                ...(useTaskStore.getState().tasks.find(t => t.id === taskId)?.subTasks ?? []),
                data.data,
            ],
        });
        return data;
    } catch (error) {
        console.error('Add subtask error:', error);
        throw error;
    }
};

export const toggleSubtask = async (taskId: string, subTaskId: string): Promise<SubTaskResponse> => {
    try {
        const token = useAuthStore.getState().accessToken;
        const response = await fetch(`${BASE_URL}/tasks/${taskId}/subtasks/${subTaskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
        });
        const data = await response.json() as SubTaskResponse;
        const task = useTaskStore.getState().tasks.find(t => t.id === taskId);
        if (task) {
            useTaskStore.getState().updateTask(taskId, {
                subTasks: task.subTasks.map(st => st.id === subTaskId ? data.data : st),
            });
        }
        return data;
    } catch (error) {
        console.error('Toggle subtask error:', error);
        throw error;
    }
};

// ─── Projects ─────────────────────────────────────────────────────────────────

export const getProjects = async (): Promise<ProjectListResponse> => {
    try {
        const token = useAuthStore.getState().accessToken;
        useProjectStore.getState().setLoading(true);
        const response = await fetch(`${BASE_URL}/projects`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
        });
        const data = await response.json() as ProjectListResponse;
        useProjectStore.getState().setProjects(data.data);
        useProjectStore.getState().setLoading(false);
        return data;
    } catch (error) {
        useProjectStore.getState().setLoading(false);
        console.error('Get projects error:', error);
        throw error;
    }
};

export const getProjectById = async (projectId: string): Promise<ProjectResponse> => {
    try {
        const token = useAuthStore.getState().accessToken;
        const response = await fetch(`${BASE_URL}/projects/${projectId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
        });
        const data = await response.json() as ProjectResponse;
        return data;
    } catch (error) {
        console.error('Get project error:', error);
        throw error;
    }
};

export const createProject = async (projectData: { name: string; color: string; emoji?: string }): Promise<ProjectResponse> => {
    try {
        const token = useAuthStore.getState().accessToken;
        const response = await fetch(`${BASE_URL}/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
            body: JSON.stringify(projectData),
        });
        const data = await response.json() as ProjectResponse;
        useProjectStore.getState().addProject(data.data);
        return data;
    } catch (error) {
        console.error('Create project error:', error);
        throw error;
    }
};

export const updateProject = async (
    projectId: string,
    projectData: Partial<{ name: string; color: string; emoji: string }>,
): Promise<ProjectResponse> => {
    try {
        const token = useAuthStore.getState().accessToken;
        const response = await fetch(`${BASE_URL}/projects/${projectId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
            body: JSON.stringify(projectData),
        });
        const data = await response.json() as ProjectResponse;
        useProjectStore.getState().updateProject(projectId, data.data);
        return data;
    } catch (error) {
        console.error('Update project error:', error);
        throw error;
    }
};

export const deleteProject = async (projectId: string): Promise<MessageResponse> => {
    try {
        const token = useAuthStore.getState().accessToken;
        const response = await fetch(`${BASE_URL}/projects/${projectId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
        });
        const data = await response.json() as MessageResponse;
        useProjectStore.getState().removeProject(projectId);
        return data;
    } catch (error) {
        console.error('Delete project error:', error);
        throw error;
    }
};

// ─── User ─────────────────────────────────────────────────────────────────────

export const updateProfile = async (profileData: { name?: string; email?: string }): Promise<UserResponse> => {
    try {
        const token = useAuthStore.getState().accessToken;
        const response = await fetch(`${BASE_URL}/users/me`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
            body: JSON.stringify(profileData),
        });
        const data = await response.json() as UserResponse;
        useAuthStore.getState().updateUser(data.user);
        return data;
    } catch (error) {
        console.error('Update profile error:', error);
        throw error;
    }
};

export const changePassword = async (passwordData: { currentPassword: string; newPassword: string }): Promise<MessageResponse> => {
    try {
        const token = useAuthStore.getState().accessToken;
        const response = await fetch(`${BASE_URL}/users/me/password`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
            body: JSON.stringify(passwordData),
        });
        const data = await response.json() as MessageResponse;
        return data;
    } catch (error) {
        console.error('Change password error:', error);
        throw error;
    }
};

export const updatePreferences = async (prefData: { darkMode?: boolean; accentTheme?: string; avatarColor?: string }): Promise<UserResponse> => {
    try {
        const token = useAuthStore.getState().accessToken;
        const response = await fetch(`${BASE_URL}/users/me/preferences`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
            body: JSON.stringify(prefData),
        });
        const data = await response.json() as UserResponse;
        useAuthStore.getState().updateUser(data.user);
        return data;
    } catch (error) {
        console.error('Update preferences error:', error);
        throw error;
    }
};