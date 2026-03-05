import { create } from 'zustand';
import type { ThemeKey } from '@/types';

interface ThemeState {
  accentTheme: ThemeKey;
  darkMode: boolean;
  setAccentTheme: (t: ThemeKey) => void;
  setDarkMode: (v: boolean) => void;
  toggleDarkMode: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  accentTheme: 'default', darkMode: false,
  setAccentTheme: (accentTheme) => set({ accentTheme }),
  setDarkMode: (darkMode) => set({ darkMode }),
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
}));
