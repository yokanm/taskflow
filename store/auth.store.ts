/**
 * @file store/auth.store.ts
 * @description Zustand store for authentication state.
 *
 * Holds the current user, access token, and loading flag.
 * The access token is kept in memory only (not persisted) — on app
 * restart, _layout.tsx calls authApi.refresh() to get a new token from
 * the httpOnly cookie and repopulates this store.
 */

import { create } from 'zustand';

export interface AuthUser {
  id:          string;
  name:        string;
  email:       string;
  avatarColor: string;
  accentTheme: string;
  darkMode:    boolean;
  createdAt:   string;
}

interface AuthState {
  user:            AuthUser | null;
  accessToken:     string | null;
  isAuthenticated: boolean;
  isLoading:       boolean;

  /** Called after a successful login or register */
  setAuth:         (user: AuthUser, accessToken: string) => void;

  /**
   * Called after a silent token refresh (when we have a new access token
   * but don't need to update the user object).
   */
  setAccessToken:  (token: string) => void;

  /** Sets only the loading flag (used during silent re-auth) */
  setLoading:      (loading: boolean) => void;

  /** Clears all auth state on logout */
  logout:          () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:            null,
  accessToken:     null,
  isAuthenticated: false,
  isLoading:       true,

  setAuth: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true, isLoading: false }),

  setAccessToken: (token) =>
    set({ accessToken: token }),

  setLoading: (isLoading) =>
    set({ isLoading }),

  logout: () =>
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false }),
}));
