/**
 * @file context/ThemeContext.tsx
 * @description Provides the active design token set to the entire app.
 *
 * Exposes `useAppTheme()` which returns a flat object of resolved colour
 * values for the current accent + dark/light mode combination.
 *
 * Consuming a component:
 *   const t = useAppTheme();
 *   <View style={{ backgroundColor: t.bg }}>
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/theme.store';

// ─── Accent palette (6 themes) ────────────────────────────────────────────────

const ACCENTS: Record<string, { accent: string; accentLight: string; accentDark: string }> = {
  default:  { accent: '#6C63FF', accentLight: '#EEF0FF', accentDark: '#4B43D6' },
  rose:     { accent: '#F43F5E', accentLight: '#FFE4E6', accentDark: '#BE123C' },
  ocean:    { accent: '#0EA5E9', accentLight: '#E0F2FE', accentDark: '#0284C7' },
  forest:   { accent: '#22C55E', accentLight: '#DCFCE7', accentDark: '#16A34A' },
  sunset:   { accent: '#F59E0B', accentLight: '#FEF3C7', accentDark: '#D97706' },
  midnight: { accent: '#8B5CF6', accentLight: '#EDE9FE', accentDark: '#7C3AED' },
};

// ─── Token sets ───────────────────────────────────────────────────────────────

const LIGHT_BASE = {
  bg:            '#F5F6FA',
  surface:       '#FFFFFF',
  surface2:      '#F0F1F8',
  elevated:      '#F0F1F8',
  border:        '#E4E6F0',
  textPrimary:   '#1A1B2E',
  textSecondary: '#6B6E8E',
  textTertiary:  '#A0A3B8',
  isDark:        false,
};

const DARK_BASE = {
  bg:            '#0F0F1A',
  surface:       '#1A1B2E',
  surface2:      '#252640',
  elevated:      '#252640',
  border:        '#2E2F4A',
  textPrimary:   '#F0F1F8',
  textSecondary: '#8B8DB8',
  textTertiary:  '#4A4C6E',
  isDark:        true,
};

// ─── Derived theme type ───────────────────────────────────────────────────────

export type AppTheme = typeof LIGHT_BASE & {
  accent:      string;
  accentLight: string;
  accentDark:  string;
  /** Toggles dark mode in the theme store */
  toggleDarkMode: () => void;
  /** Sets the active accent theme key */
  setAccentTheme: (key: string) => void;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext<AppTheme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { darkMode, accentTheme, toggleDarkMode, setAccentTheme } = useThemeStore();
  const systemScheme = useColorScheme();

  const theme = useMemo<AppTheme>(() => {
    const base   = darkMode ?? systemScheme === 'dark' ? DARK_BASE : LIGHT_BASE;
    const colors = ACCENTS[accentTheme] ?? ACCENTS.default!;
    return {
      ...base,
      ...colors,
      toggleDarkMode,
      setAccentTheme,
    };
  }, [darkMode, accentTheme, systemScheme, toggleDarkMode, setAccentTheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/**
 * Returns the resolved theme token set for the current accent + dark/light mode.
 * Must be called inside a component wrapped by `<ThemeProvider>`.
 */
export function useAppTheme(): AppTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used inside <ThemeProvider>');
  return ctx;
}
