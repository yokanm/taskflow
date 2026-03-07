/**
 * @file app/_layout.tsx
 * @description Root layout for TaskFlow. Wraps the entire app in
 * ThemeProvider and handles auth-guarding every route.
 *
 * FIX: Silent re-auth now correctly calls /auth/refresh FIRST (to get a new
 * access token via the httpOnly cookie), then /auth/me (to get the user profile).
 * The original code called /auth/me directly, but that endpoint does NOT return
 * an access token — so every subsequent API call would silently fail with 401.
 */

import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useAppTheme } from '../context/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '../services/api';
import type { AuthUserShape } from '../services/api';

// ─── Auth Guard ───────────────────────────────────────────────────────────────

/**
 * Wraps the app and handles:
 *  1. Silent re-auth on mount (refresh token → access token → user profile)
 *  2. Route protection: redirects unauthenticated users to /(auth)
 *  3. Redirects already-authenticated users away from /(auth)
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, setAuth, setLoading } = useAuthStore();
  const router   = useRouter();
  const segments = useSegments();
  const t        = useAppTheme();

  // ── Silent re-auth on app launch ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        /**
         * Step 1: Call /auth/refresh with the httpOnly refresh-token cookie.
         * This returns a new short-lived access token.
         *
         * IMPORTANT: /auth/me does NOT return an access token.
         * We must call /auth/refresh first, not /auth/me.
         */
        const refreshResult = await authApi.refresh();
        const newAccessToken = refreshResult.accessToken;

        /**
         * Step 2: Use the new access token to fetch the user's profile.
         * authApi.me() will automatically use the token we just received
         * because we immediately save it to the store before the next call.
         */
        useAuthStore.getState().setAccessToken(newAccessToken);
        const meResult = await authApi.me();

        // Step 3: Populate the auth store — this sets isAuthenticated = true
        // and isLoading = false, which triggers the route guard below.
        setAuth(meResult.user as unknown as Parameters<typeof setAuth>[0], newAccessToken);

      } catch {
        // No valid refresh cookie (first launch, expired, or logged out)
        // Just mark loading as done — the route guard will redirect to sign-in
        setLoading(false);
      }
    })();
  }, []); // Run once on mount — intentionally empty deps

  // ── Route guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return; // Don't redirect while we're still checking the token

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Not logged in and trying to access a protected screen → go to sign-in
      router.replace('/(auth)');
    } else if (isAuthenticated && inAuthGroup) {
      // Already logged in but on a sign-in screen → go to the app
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
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AuthGuard>
    </ThemeProvider>
  );
}
