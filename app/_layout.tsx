/**
 * @file app/_layout.tsx
 *
 * FIXES vs previous version:
 * 1. Added Stack.Screen for profile/change-password — was unregistered,
 *    caused "Unmatched Route" crash when the button was pressed.
 * 2. Added Stack.Screen for profile/edit-profile — same problem.
 * 3. Theme persistence: after silent re-auth on startup, the user's saved
 *    darkMode and accentTheme are now applied to the theme store.
 *    Previously the theme store always started at (false, 'default') regardless
 *    of what was saved in the DB.
 */

import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useAppTheme } from '../context/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import type { ThemeKey } from '@/store/theme.store';
import { authApi } from '../services/api';

// ─── Auth Guard ───────────────────────────────────────────────────────────────

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, setAuth, setLoading } = useAuthStore();
  const router   = useRouter();
  const segments = useSegments();
  const t        = useAppTheme();

  useEffect(() => {
    (async () => {
      try {
        // 1. Get a fresh access token from the httpOnly refresh cookie
        const refreshResult  = await authApi.refresh();
        const newAccessToken = refreshResult.accessToken;
        useAuthStore.getState().setAccessToken(newAccessToken);

        // 2. Fetch the user's full profile (includes saved theme preferences)
        const meResult = await authApi.me();
        setAuth(meResult.user as Parameters<typeof setAuth>[0], newAccessToken);

        // 3. FIX: Apply saved theme preferences to the theme store.
        //    Previously the store always reset to (darkMode: false, accentTheme: 'default')
        //    on every app start, ignoring whatever the user had saved in the DB.
        const { setDarkMode, setAccentTheme } = useThemeStore.getState();
        setDarkMode(meResult.user.darkMode);
        setAccentTheme(meResult.user.accentTheme as ThemeKey);

      } catch {
        // Refresh failed — user needs to log in again
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return (
    <>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      {children}
    </>
  );
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }}>

          {/* Main navigators */}
          <Stack.Screen name="(auth)"  options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)"  options={{ animation: 'fade' }} />

          {/* Profile screens */}
          <Stack.Screen
            name="profile/appearance"
            options={{ animation: 'slide_from_right' }}
          />
          {/* FIX 1: was unregistered — pressing "Change Password" crashed with Unmatched Route */}
          <Stack.Screen
            name="profile/change-password"
            options={{ animation: 'slide_from_right' }}
          />
          {/* FIX 2: was unregistered — pressing "Edit Profile" crashed with Unmatched Route */}
          <Stack.Screen
            name="profile/edit-profile"
            options={{ animation: 'slide_from_right' }}
          />

          {/* Task screens */}
          <Stack.Screen
            name="tasks/[id]"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="tasks/create"
            options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
          />

          {/* Project screens */}
          <Stack.Screen
            name="projects/[id]"
            options={{ animation: 'slide_from_right' }}
          />

        </Stack>
      </AuthGuard>
    </ThemeProvider>
  );
}
