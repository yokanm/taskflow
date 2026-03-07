/**
 * @file app/_layout.tsx
 *
 * FIXES:
 * 1. Added Stack.Screen for every route outside (auth)/(tabs):
 *      profile/appearance, tasks/[id], tasks/create, projects/[id]
 *    In Expo Router v6, when you declare a <Stack> you MUST explicitly register
 *    every screen — unlisted routes throw "Unmatched Route" at runtime.
 */

import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useAppTheme } from '../context/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
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
        const refreshResult  = await authApi.refresh();
        const newAccessToken = refreshResult.accessToken;
        useAuthStore.getState().setAccessToken(newAccessToken);
        const meResult = await authApi.me();
        setAuth(meResult.user as Parameters<typeof setAuth>[0], newAccessToken);
      } catch {
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

// ─── Root layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }}>

          {/* Main navigators */}
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />

          {/* ── FIX: these four screens were unregistered, causing
              "Unmatched Route" errors every time they were navigated to ── */}
          <Stack.Screen
            name="profile/appearance"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="tasks/[id]"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="tasks/create"
            options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
          />
          <Stack.Screen
            name="projects/[id]"
            options={{ animation: 'slide_from_right' }}
          />

        </Stack>
      </AuthGuard>
    </ThemeProvider>
  );
}