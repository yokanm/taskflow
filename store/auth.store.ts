/**
 * @file store/auth.store.ts
 * @description Zustand store for authentication state.
 * Extended to include profileImage, bio, location, and language.
 */

import { create } from 'zustand';

export interface AuthUser {
  id:           string;
  name:         string;
  email:        string;
  avatarColor:  string;
  accentTheme:  string;
  darkMode:     boolean;
  createdAt:    string;
  // Extended profile fields (stored client-side)
  bio?:         string;
  location?:    string;
  language?:    string;
  profileImage?: string | null;
}

interface AuthState {
  user:            AuthUser | null;
  accessToken:     string | null;
  isAuthenticated: boolean;
  isLoading:       boolean;

  setAuth:         (user: AuthUser, accessToken: string) => void;
  setAccessToken:  (token: string) => void;
  setLoading:      (loading: boolean) => void;
  logout:          () => void;
  /** Update profile fields without full re-auth */
  updateUser:      (updates: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:            null,
  accessToken:     null,
  isAuthenticated: false,
  isLoading:       true,

  setAuth: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true, isLoading: false }),

  setAccessToken: (token) => set({ accessToken: token }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () =>
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false }),

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
}));
