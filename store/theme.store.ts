/**
 * @file store/theme.store.ts
 * @description Zustand store for user theme preferences.
 * Persists dark mode and accent theme across the session.
 */

import { create } from 'zustand';

export type ThemeKey = 'default' | 'rose' | 'ocean' | 'forest' | 'sunset' | 'midnight';

interface ThemeState {
  darkMode:       boolean;
  accentTheme:    ThemeKey;
  toggleDarkMode: () => void;
  setDarkMode:    (dark: boolean) => void;
  setAccentTheme: (key: ThemeKey) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  darkMode:    false,
  accentTheme: 'default',

  toggleDarkMode: () =>
    set((state) => ({ darkMode: !state.darkMode })),

  setDarkMode: (dark) => set({ darkMode: dark }),

  setAccentTheme: (key) => set({ accentTheme: key }),
}));
