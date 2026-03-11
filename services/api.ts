import { apiFetch } from '@/services/apiClient';
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

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
    login:    ({ email, password }: { email: string; password: string }) =>
                  login(email, password),
    register: ({ name, email, password }: { name: string; email: string; password: string }) =>
                  register(name, email, password),
};

export const register = async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const data = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
    });
    useAuthStore.getState().setAuth(data.user, data.accessToken);
    return data;
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
    const data = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    useAuthStore.getState().setAuth(data.user, data.accessToken);
    return data;
};

export const logout = async (): Promise<MessageResponse> => {
    const data = await apiFetch<MessageResponse>('/auth/logout', { method: 'POST' });
    useAuthStore.getState().logout();
    useTaskStore.getState().clearTasks();
    useProjectStore.getState().clearProjects();
    return data;
};

export const refreshToken = async (): Promise<RefreshResponse> => {
    try {
        const data = await apiFetch<RefreshResponse>('/auth/refresh', { method: 'POST' });
        useAuthStore.getState().setAccessToken(data.accessToken);
        return data;
    } catch (error) {
        useAuthStore.getState().logout();
        throw error;
    }
};

export const getMe = async (): Promise<{ user: User }> => {
    const data = await apiFetch<{ user: User }>('/auth/me');
    useAuthStore.getState().updateUser(data.user);
    return data;
};

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const getTasks = async (filters?: Record<string, string>): Promise<TaskListResponse> => {
    const queryString = filters ? '?' + new URLSearchParams(filters).toString() : '';
    useTaskStore.getState().setLoading(true);
    try {
        const data = await apiFetch<TaskListResponse>(`/tasks${queryString}`);
        useTaskStore.getState().setTasks(data.data);
        return data;
    } finally {
        useTaskStore.getState().setLoading(false);
    }
};

export const getTaskById = async (taskId: string): Promise<TaskResponse> => {
    return apiFetch<TaskResponse>(`/tasks/${taskId}`);
};

export const createTask = async (taskData: Record<string, unknown>): Promise<TaskResponse> => {
    const data = await apiFetch<TaskResponse>('/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
    });
    useTaskStore.getState().addTask(data.data);
    return data;
};

export const updateTask = async (taskId: string, taskData: Record<string, unknown>): Promise<TaskResponse> => {
    const data = await apiFetch<TaskResponse>(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(taskData),
    });
    useTaskStore.getState().updateTask(taskId, data.data);
    return data;
};

export const toggleTask = async (taskId: string): Promise<TaskResponse> => {
    // Optimistic update
    useTaskStore.getState().toggleTask(taskId);
    try {
        const data = await apiFetch<TaskResponse>(`/tasks/${taskId}/toggle`, { method: 'PATCH' });
        useTaskStore.getState().updateTask(taskId, data.data);
        return data;
    } catch (error) {
        // Roll back optimistic update on failure
        useTaskStore.getState().toggleTask(taskId);
        throw error;
    }
};

export const deleteTask = async (taskId: string): Promise<MessageResponse> => {
    const data = await apiFetch<MessageResponse>(`/tasks/${taskId}`, { method: 'DELETE' });
    useTaskStore.getState().removeTask(taskId);
    return data;
};

export const addSubtask = async (taskId: string, title: string): Promise<SubTaskResponse> => {
    const data = await apiFetch<SubTaskResponse>(`/tasks/${taskId}/subtasks`, {
        method: 'POST',
        body: JSON.stringify({ title }),
    });
    const existing = useTaskStore.getState().tasks.find(t => t.id === taskId)?.subTasks ?? [];
    useTaskStore.getState().updateTask(taskId, { subTasks: [...existing, data.data] });
    return data;
};

export const toggleSubtask = async (taskId: string, subTaskId: string): Promise<SubTaskResponse> => {
    const data = await apiFetch<SubTaskResponse>(`/tasks/${taskId}/subtasks/${subTaskId}`, {
        method: 'PATCH',
    });
    const task = useTaskStore.getState().tasks.find(t => t.id === taskId);
    if (task) {
        useTaskStore.getState().updateTask(taskId, {
            subTasks: task.subTasks.map(st => st.id === subTaskId ? data.data : st),
        });
    }
    return data;
};

// ─── Projects ─────────────────────────────────────────────────────────────────

export const getProjects = async (): Promise<ProjectListResponse> => {
    useProjectStore.getState().setLoading(true);
    try {
        const data = await apiFetch<ProjectListResponse>('/projects');
        useProjectStore.getState().setProjects(data.data);
        return data;
    } finally {
        useProjectStore.getState().setLoading(false);
    }
};

export const getProjectById = async (projectId: string): Promise<ProjectResponse> => {
    return apiFetch<ProjectResponse>(`/projects/${projectId}`);
};

export const createProject = async (projectData: { name: string; color: string; emoji?: string }): Promise<ProjectResponse> => {
    const data = await apiFetch<ProjectResponse>('/projects', {
        method: 'POST',
        body: JSON.stringify(projectData),
    });
    useProjectStore.getState().addProject(data.data);
    return data;
};

export const updateProject = async (
    projectId: string,
    projectData: Partial<{ name: string; color: string; emoji: string }>,
): Promise<ProjectResponse> => {
    const data = await apiFetch<ProjectResponse>(`/projects/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify(projectData),
    });
    useProjectStore.getState().updateProject(projectId, data.data);
    return data;
};

export const deleteProject = async (projectId: string): Promise<MessageResponse> => {
    const data = await apiFetch<MessageResponse>(`/projects/${projectId}`, { method: 'DELETE' });
    useProjectStore.getState().removeProject(projectId);
    return data;
};

// ─── User ─────────────────────────────────────────────────────────────────────

export const updateProfile = async (profileData: { name?: string; email?: string }): Promise<UserResponse> => {
    const data = await apiFetch<UserResponse>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(profileData),
    });
    useAuthStore.getState().updateUser(data.user);
    return data;
};

export const changePassword = async (passwordData: { currentPassword: string; newPassword: string }): Promise<MessageResponse> => {
    return apiFetch<MessageResponse>('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify(passwordData),
    });
};

export const updatePreferences = async (
    prefData: { darkMode?: boolean; accentTheme?: string; avatarColor?: string },
): Promise<UserResponse> => {
    const data = await apiFetch<UserResponse>('/users/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify(prefData),
    });
    useAuthStore.getState().updateUser(data.user);
    return data;
};