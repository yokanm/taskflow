import React, { createContext, useContext, useMemo } from 'react';
import { useThemeStore } from '@/store/theme.store';
import { buildTheme, type AppTheme } from '../constants/theme-config';
import type { ThemeKey } from '@/types';

interface ThemeCtx extends AppTheme {
  accentTheme: ThemeKey;
  setAccentTheme: (t: ThemeKey) => void;
  toggleDarkMode: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { accentTheme, darkMode, setAccentTheme, toggleDarkMode } = useThemeStore();
  const value = useMemo(
    () => ({ ...buildTheme(accentTheme, darkMode), accentTheme, setAccentTheme, toggleDarkMode }),
    [accentTheme, darkMode, setAccentTheme, toggleDarkMode]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppTheme must be inside ThemeProvider');
  return ctx;
}
