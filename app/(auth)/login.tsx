import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet,KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '../../services/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { User } from '@/types';

export default function Login() {
  const t = useAppTheme();
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await authApi.login({ email: email.trim(), password });
      const payload = data as { user: User; accessToken: string };
      setAuth(payload.user, payload.accessToken);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Login failed. Please try again.';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            {/* Back */}
            <TouchableOpacity style={[styles.backBtn, { backgroundColor: t.surface, borderColor: t.border }]} onPress={() => router.back()}>
              <Text style={{ fontSize: 18, color: t.textPrimary }}>‹</Text>
            </TouchableOpacity>

            <Text style={[styles.heading, { color: t.textPrimary }]}>Welcome Back 👋</Text>
            <Text style={[styles.sub, { color: t.textSecondary }]}>Sign in to your account</Text>

            {errors.general && (
              <View style={[styles.errorBanner, { backgroundColor: '#FEE2E2' }]}>
                <Text style={{ color: '#DC2626', fontSize: 13 }}>{errors.general}</Text>
              </View>
            )}

            <Input label="Email address" value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none" autoComplete="email"
              placeholder="you@example.com" error={errors.email} />

            <Input label="Password" value={password} onChangeText={setPassword}
              secureTextEntry={!showPass} autoComplete="password"
              placeholder="••••••••" error={errors.password}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Text style={{ color: t.textTertiary, fontSize: 12 }}>{showPass ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              } />

            <TouchableOpacity style={styles.forgot}>
              <Text style={{ color: t.accent, fontSize: 13, fontWeight: '600' }}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button label="Sign In" fullWidth onPress={handleLogin} loading={loading} style={{ marginBottom: 20 }} />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.line, { backgroundColor: t.border }]} />
              <Text style={{ color: t.textTertiary, fontSize: 12, marginHorizontal: 12 }}>or continue with</Text>
              <View style={[styles.line, { backgroundColor: t.border }]} />
            </View>

            {/* Social */}
            <View style={styles.social}>
              {[{ label: 'Google', bg: '#4285F4', letter: 'G' }, { label: 'Apple', bg: '#000', letter: '🍎' }].map((s) => (
                <TouchableOpacity key={s.label} style={[styles.socialBtn, { backgroundColor: t.surface, borderColor: t.border }]}>
                  <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: s.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: 'white' }}>{s.letter}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: t.textPrimary }}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
              <Text style={{ color: t.textSecondary, fontSize: 14 }}>Don&apos;t have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
                <Text style={{ color: t.accent, fontWeight: '700', fontSize: 14 }}>Create one</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 12, flex: 1 },
  backBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  heading: { fontSize: 24, fontWeight: '700', letterSpacing: -0.8, marginBottom: 6 },
  sub: { fontSize: 14, marginBottom: 28 },
  errorBanner: { padding: 12, borderRadius: 10, marginBottom: 16 },
  forgot: { alignSelf: 'flex-end', marginTop: -8, marginBottom: 24 },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  line: { flex: 1, height: 1 },
  social: { flexDirection: 'row', gap: 10 },
  socialBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
