// ─── Enums ────────────────────────────────────────────────────────────────────

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export type ThemeKey = 'default' | 'rose' | 'ocean' | 'forest' | 'sunset' | 'midnight';

// ─── Models ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  accentTheme: ThemeKey;
  darkMode: boolean;
  createdAt: string;
}

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
  taskId: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string;
  userId: string;
  projectId?: string;
  project?: Project;
  subTasks: SubTask[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  emoji?: string;
  userId: string;
  tasks: Task[];
  createdAt: string;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ─── Theme ────────────────────────────────────────────────────────────────────

export interface ThemeColors {
  accent: string;
  accentLight: string;
  accentDark: string;
  bg: string;
  card: string;
  elevated: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
}
