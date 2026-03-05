import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useAppTheme } from '../context/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '../services/api';
import type { User } from '@/types';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, setAuth, setLoading } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const t = useAppTheme();

  // Attempt silent re-auth on mount via cookie-based refresh
  useEffect(() => {
    (async () => {
      try {
        const { data } = await authApi.me();
        const payload = data as { user: User; accessToken: string };
        setAuth(payload.user, payload.accessToken);
      } catch {
        setLoading(false);
      }
    })();
  }, [setAuth, setLoading]);

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuth) router.replace('/(auth)');
    if (isAuthenticated && inAuth) router.replace('/(tabs)');
  }, [isAuthenticated, isLoading, segments, router]);

  return (
    <>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      {children}
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AuthGuard>
    </ThemeProvider>
  );
}
