import type { ThemeKey } from '@/types';

export const ACCENT_PALETTES: Record<ThemeKey, {
  accent: string; accentLight: string; accentLightDark: string; accentDark: string; shadow: string;
}> = {
  default:  { accent: '#6C63FF', accentLight: '#EEF0FF', accentLightDark: '#1E1D3F', accentDark: '#4B43D6', shadow: 'rgba(108,99,255,0.28)'  },
  rose:     { accent: '#F43F5E', accentLight: '#FFE4E6', accentLightDark: '#4c0519', accentDark: '#E11D48', shadow: 'rgba(244,63,94,0.28)'   },
  ocean:    { accent: '#0EA5E9', accentLight: '#E0F2FE', accentLightDark: '#082f49', accentDark: '#0284C7', shadow: 'rgba(14,165,233,0.28)'  },
  forest:   { accent: '#22C55E', accentLight: '#DCFCE7', accentLightDark: '#052e16', accentDark: '#16A34A', shadow: 'rgba(34,197,94,0.28)'   },
  sunset:   { accent: '#F59E0B', accentLight: '#FEF3C7', accentLightDark: '#451a03', accentDark: '#D97706', shadow: 'rgba(245,158,11,0.28)'  },
  midnight: { accent: '#8B5CF6', accentLight: '#EDE9FE', accentLightDark: '#2e1065', accentDark: '#7C3AED', shadow: 'rgba(139,92,246,0.28)' },
};

export const LIGHT_TOKENS = {
  bg: '#F5F6FA', surface: '#FFFFFF', surface2: '#F0F1F8', border: '#E4E6F0',
  textPrimary: '#1A1B2E', textSecondary: '#6B6E8E', textTertiary: '#A0A3B8',
  shadow: 'rgba(26,27,46,0.08)',
};

export const DARK_TOKENS = {
  bg: '#0F0F1A', surface: '#1A1B2E', surface2: '#252640', border: '#2E2F4A',
  textPrimary: '#F0F1F8', textSecondary: '#8B8DB8', textTertiary: '#4A4C6E',
  shadow: 'rgba(0,0,0,0.5)',
};

export const PRIORITY_STYLES = {
  HIGH:   { bg: '#FEE2E2', bgDark: '#450a0a', text: '#DC2626', textDark: '#FCA5A5', dot: '#DC2626' },
  MEDIUM: { bg: '#FEF3C7', bgDark: '#431407', text: '#D97706', textDark: '#FCD34D', dot: '#D97706' },
  LOW:    { bg: '#DCFCE7', bgDark: '#052e16', text: '#16A34A', textDark: '#86EFAC', dot: '#16A34A' },
};

export const STATUS_STYLES = {
  TODO:        { bg: '#F0F1F8', bgDark: '#252640', text: '#6B6E8E', textDark: '#8B8DB8'  },
  IN_PROGRESS: { bg: '#EFF6FF', bgDark: '#1e3a5f', text: '#2563EB', textDark: '#93C5FD'  },
  DONE:        { bg: '#DCFCE7', bgDark: '#052e16', text: '#16A34A', textDark: '#86EFAC'  },
};

export type AppTheme = {
  accent: string; accentLight: string; accentDark: string; accentShadow: string;
  bg: string; surface: string; surface2: string; border: string;
  textPrimary: string; textSecondary: string; textTertiary: string;
  shadow: string; isDark: boolean;
};

export function buildTheme(key: ThemeKey, isDark: boolean): AppTheme {
  const p = ACCENT_PALETTES[key];
  const t = isDark ? DARK_TOKENS : LIGHT_TOKENS;
  return {
    accent: p.accent, accentLight: isDark ? p.accentLightDark : p.accentLight,
    accentDark: p.accentDark, accentShadow: p.shadow, ...t, isDark,
  };
}
