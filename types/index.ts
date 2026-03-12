// types/index.ts

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export type ThemeKey =
  | 'default'
  | 'rose'
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'midnight';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  accentTheme: ThemeKey;
  darkMode: boolean;
  createdAt: string;
  /** Optional profile image URI — used by Avatar component */
  profileImage?: string | null;
}

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
  taskId: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  emoji?: string;
  userId: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string;
  userId: string;
  projectId?: string | null;
  project?: Project;
  subTasks: SubTask[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: User;
}