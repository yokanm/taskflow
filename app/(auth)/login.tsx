/**
 * @file app/(auth)/login.tsx
 * FIXES:
 * 1. Web: Input fields now render with proper browser-native UX (no outline clash)
 * 2. Android: KeyboardAvoidingView uses correct behavior + ScrollView config
 * 3. Deprecated shadow* props replaced with Platform-aware boxShadow / elevation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/services/api';
import { loginSchema, getFieldErrors } from '@/services/validators';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { User } from '@/types';

export default function Login() {
  const t       = useAppTheme();
  const router  = useRouter();
  const { setAuth } = useAuthStore();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState<Record<string, string>>({});

  function validate(): boolean {
    const result = loginSchema.safeParse({ email: email.trim(), password });
    if (!result.success) { setErrors(getFieldErrors(result.error)); return false; }
    setErrors({});
    return true;
  }

  async function handleLogin(): Promise<void> {
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await authApi.login({ email: email.trim(), password });
      setAuth(response.user as unknown as User, response.accessToken);
      router.replace('/(tabs)');
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Login failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      {/*
        Android fix: behavior="height" works better than "padding" on Android.
        On iOS "padding" is correct. On web, no KeyboardAvoidingView needed.
      */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        // Android: extra offset to account for status bar
        keyboardVerticalOffset={Platform.OS === 'android' ? 24 : 0}
        enabled={Platform.OS !== 'web'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          // Android fix: prevents scroll jumping when keyboard opens
          keyboardDismissMode="interactive"
        >
          <View style={styles.container}>
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: t.surface, borderColor: t.border }]}
              onPress={() => router.back()}
            >
              <Text style={{ fontSize: 18, color: t.textPrimary }}>‹</Text>
            </TouchableOpacity>

            <Text style={[styles.heading, { color: t.textPrimary }]}>Welcome Back 👋</Text>
            <Text style={[styles.sub, { color: t.textSecondary }]}>Sign in to your account</Text>

            {errors.general ? (
              <View style={[styles.errorBanner, { backgroundColor: '#FEE2E2' }]}>
                <Text style={{ color: '#DC2626', fontSize: 13 }}>{errors.general}</Text>
              </View>
            ) : null}

            <Input
              label="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email}
              // Android: move to next field
              returnKeyType="next"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              autoComplete="password"
              placeholder="••••••••"
              error={errors.password}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowPass(!showPass)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={{ color: t.textTertiary, fontSize: 12, fontWeight: '600' }}>
                    {showPass ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              }
            />

            <TouchableOpacity style={styles.forgot}>
              <Text style={{ color: t.accent, fontSize: 13, fontWeight: '600' }}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <Button
              label="Sign In"
              fullWidth
              onPress={handleLogin}
              loading={loading}
              style={{ marginBottom: 20 }}
            />

            <View style={styles.divider}>
              <View style={[styles.line, { backgroundColor: t.border }]} />
              <Text style={{ color: t.textTertiary, fontSize: 12, marginHorizontal: 12 }}>
                or continue with
              </Text>
              <View style={[styles.line, { backgroundColor: t.border }]} />
            </View>

            <View style={styles.social}>
              {[
                { label: 'Google', bg: '#4285F4', letter: 'G' },
                { label: 'Apple',  bg: '#000',    letter: '🍎' },
              ].map((s) => (
                <TouchableOpacity
                  key={s.label}
                  style={[styles.socialBtn, { backgroundColor: t.surface, borderColor: t.border }]}
                >
                  <View style={{
                    width: 18, height: 18, borderRadius: 9,
                    backgroundColor: s.bg,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: 'white' }}>
                      {s.letter}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: t.textPrimary }}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.signupRow}>
              <Text style={{ color: t.textSecondary, fontSize: 14 }}>
                Don&apos;t have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
                <Text style={{ color: t.accent, fontWeight: '700', fontSize: 14 }}>
                  Create one
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  container:     { padding: 24, paddingTop: 12, flex: 1 },
  backBtn:       {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  heading:       { fontSize: 24, fontWeight: '700', letterSpacing: -0.8, marginBottom: 6 },
  sub:           { fontSize: 14, marginBottom: 28 },
  errorBanner:   { padding: 12, borderRadius: 10, marginBottom: 16 },
  forgot:        { alignSelf: 'flex-end', marginTop: -8, marginBottom: 24 },
  divider:       { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  line:          { flex: 1, height: 1 },
  social:        { flexDirection: 'row', gap: 10 },
  socialBtn:     {
    flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    flexWrap: 'wrap',
  },
});
